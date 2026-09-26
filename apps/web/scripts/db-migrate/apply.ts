/**
 * 배포 DB(Turso)에 마이그레이션 SQL을 적용한다.
 *
 * 배포 DB에는 `db:push`를 쓰지 않는다(CLAUDE.md '작업 절차') — push에서 '만들기'를 고르면 기존 테이블이
 * 지워진다. 대신 `drizzle/`의 SQL을 이 스크립트로 적용한다.
 *
 *   pnpm --filter @subslash/web db:apply                 # 확인만: 0011~0013이 적용됐는지 보여 준다
 *   pnpm --filter @subslash/web db:apply -- --apply 0012 # 0012를 적용한다
 *
 * 접속 정보는 환경 변수 TURSO_DATABASE_URL·TURSO_AUTH_TOKEN으로 받고, 없으면 묻는다(토큰은 화면에
 * 보이지 않게 입력). 토큰은 파일에 쓰지 않는다.
 *
 * 안전장치:
 * - 기본은 읽기만 한다. `--apply <번호>`를 줘야 쓴다.
 * - 이미 적용됐거나 일부만 적용된 파일은 적용하지 않는다(일부만 있으면 사람이 봐야 한다).
 * - 앞선 테이블이 없으면(다른 DB이거나 앞 마이그레이션이 빠졌으면) 적용하지 않는다.
 * - 한 파일의 문장을 한 트랜잭션으로 보낸다. 중간에 실패하면 아무것도 바뀌지 않는다.
 * - 적용한 뒤 다시 읽어 확인한다.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createClient, type Client } from "@libsql/client";

type State = "applied" | "missing" | "partial" | "blocked";

interface Migration {
  id: string;
  file: string;
  /** 이 DB에 이 마이그레이션이 적용됐는지. */
  check: (schema: Schema) => { state: State; detail: string };
}

interface Schema {
  tables: Set<string>;
  indexes: Map<string, string>;
}

function tablesState(schema: Schema, tables: string[], requires: string[]) {
  const missingRequired = requires.filter((t) => !schema.tables.has(t));
  const present = tables.filter((t) => schema.tables.has(t));
  if (present.length === tables.length) {
    return { state: "applied" as State, detail: `${tables.join(", ")} 있음` };
  }
  if (present.length > 0) {
    return {
      state: "partial" as State,
      detail: `${present.join(", ")}만 있음 — 직접 확인이 필요합니다`,
    };
  }
  if (missingRequired.length > 0) {
    return {
      state: "blocked" as State,
      detail: `앞선 테이블(${missingRequired.join(", ")})이 없어 적용할 수 없습니다`,
    };
  }
  return { state: "missing" as State, detail: `${tables.join(", ")} 없음` };
}

const MIGRATIONS: Migration[] = [
  {
    id: "0011",
    file: "0011_anonymous_stats.sql",
    check: (schema) => tablesState(schema, ["stats_contributors", "stats_items"], []),
  },
  {
    id: "0012",
    file: "0012_device_usage.sql",
    check: (schema) => tablesState(schema, ["usage_devices", "usage_intervals"], ["accounts"]),
  },
  {
    id: "0013",
    file: "0013_notify_email_not_unique.sql",
    check: (schema) => {
      if (!schema.tables.has("notification_subscribers")) {
        return {
          state: "blocked",
          detail: "notification_subscribers가 없어 적용할 수 없습니다",
        };
      }
      const sql = schema.indexes.get("notification_subscribers_email_idx");
      if (sql === undefined) {
        return {
          state: "partial",
          detail: "notification_subscribers_email_idx가 없음 — 직접 확인이 필요합니다",
        };
      }
      return /\bUNIQUE\b/i.test(sql)
        ? { state: "missing", detail: "이메일 인덱스가 아직 UNIQUE" }
        : { state: "applied", detail: "이메일 인덱스가 일반 인덱스" };
    },
  },
  {
    id: "0014",
    file: "0014_social_login.sql",
    check: (schema) =>
      tablesState(schema, ["account_identities", "oauth_app_claims"], ["accounts"]),
  },
];

const STATE_LABEL: Record<State, string> = {
  applied: "적용됨",
  missing: "적용 안 됨",
  partial: "일부만",
  blocked: "적용 불가",
};

function ask(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (hidden) {
    // 입력한 글자를 화면에 되풀이하지 않는다.
    const internal = rl as unknown as { _writeToOutput: (text: string) => void };
    internal._writeToOutput = (text: string) => {
      if (text.startsWith(question)) process.stdout.write(question);
    };
  }
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    }),
  );
}

async function readSchema(client: Client): Promise<Schema> {
  const result = await client.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE type IN ('table', 'index')",
  );
  const schema: Schema = { tables: new Set(), indexes: new Map() };
  for (const row of result.rows) {
    const name = String(row.name);
    if (row.type === "table") schema.tables.add(name);
    else schema.indexes.set(name, String(row.sql ?? ""));
  }
  return schema;
}

function statementsOf(file: string): string[] {
  const sql = readFileSync(path.resolve(__dirname, "../../drizzle", file), "utf8");
  return sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function report(schema: Schema) {
  for (const migration of MIGRATIONS) {
    const { state, detail } = migration.check(schema);
    console.error(`  ${migration.id}  ${STATE_LABEL[state].padEnd(6)}  ${detail}`);
  }
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const applyIndex = args.indexOf("--apply");
  const applyId = applyIndex >= 0 ? args[applyIndex + 1] : null;
  if (applyIndex >= 0 && !applyId) throw new Error("--apply 뒤에 번호(예: 0012)를 적어 주세요.");
  const target = applyId ? MIGRATIONS.find((m) => m.id === applyId) : null;
  if (applyId && !target) {
    throw new Error(
      `${applyId}는 이 스크립트가 아는 마이그레이션이 아닙니다(${MIGRATIONS.map((m) => m.id).join(", ")}).`,
    );
  }

  const url = process.env.TURSO_DATABASE_URL || (await ask("TURSO_DATABASE_URL: "));
  // file:은 적용 전에 로컬 사본으로 시험해 볼 때만 쓴다. 토큰이 필요 없다.
  const local = url.startsWith("file:");
  if (!local && !url.startsWith("libsql://") && !url.startsWith("https://")) {
    throw new Error("배포 DB 주소는 libsql:// 또는 https://로 시작해야 합니다.");
  }
  const authToken = local
    ? undefined
    : process.env.TURSO_AUTH_TOKEN || (await ask("TURSO_AUTH_TOKEN: ", true));
  if (!local && !authToken) throw new Error("토큰이 비어 있습니다.");

  const client = createClient({ url, authToken });
  try {
    console.error(`\nDB: ${local ? url : new URL(url).host}`);
    const schema = await readSchema(client);
    report(schema);

    if (!target) {
      console.error("\n확인만 했습니다. 적용하려면 --apply <번호>를 붙여 다시 실행하세요.");
      return;
    }

    const { state, detail } = target.check(schema);
    if (state !== "missing") {
      console.error(`\n${target.id}는 ${STATE_LABEL[state]} 상태라 적용하지 않습니다(${detail}).`);
      if (state !== "applied") process.exitCode = 1;
      return;
    }

    const statements = statementsOf(target.file);
    console.error(`\n${target.file}의 ${statements.length}개 문장을 한 트랜잭션으로 적용합니다...`);
    await client.batch(statements, "write");

    const after = target.check(await readSchema(client));
    if (after.state !== "applied") {
      throw new Error(`적용한 뒤 확인했는데 ${STATE_LABEL[after.state]}입니다(${after.detail}).`);
    }
    console.error(`${target.id} 적용 완료 — ${after.detail}`);
  } finally {
    client.close();
  }
}

main().catch((error: unknown) => {
  // 오류 메시지에 접속 정보가 섞일 수 있어 토큰을 가린다.
  const token = process.env.TURSO_AUTH_TOKEN;
  let message = error instanceof Error ? error.message : String(error);
  if (token) message = message.split(token).join("***");
  console.error(`\n실패: ${message}`);
  process.exitCode = 1;
});

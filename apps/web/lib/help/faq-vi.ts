import type { FAQ_EN } from "./faq-en";

/**
 * 도움말 FAQ의 베트남어. 한국어 원문(`faq.ts`)과 id가 같고 같은
 * 사실만 적는다 — 한국어 답을 고치면 영어·이 파일도 함께 고친다.
 */
export const FAQ_GROUP_TITLES_VI: Record<string, string> = {
  시작하기: "Bắt đầu",
  "기록과 로그인": "Dữ liệu và đăng nhập",
  해지: "Hủy đăng ký",
  "알림과 가져오기": "Nhắc nhở và nhập dữ liệu",
  "AI에게 묻기": "Hỏi AI",
};

export const FAQ_VI: typeof FAQ_EN = {
  "what-is": {
    q: "SubSlash làm gì?",
    a: "Ứng dụng cho biết mỗi gói đăng ký tốn bao nhiêu cho một lần dùng (chi phí mỗi lần dùng) và hướng dẫn bạn đến nơi hủy những gói không đáng tiền. Hãy thêm các gói đăng ký và check-in số lần bạn đã dùng mỗi gói trong 30 ngày qua, ứng dụng sẽ tự tính.",
  },
  "cost-per-use": {
    q: "Chi phí mỗi lần dùng được tính thế nào?",
    a: "Lấy phần tiền hằng tháng của bạn chia cho số lần dùng trong 30 ngày qua. Với gói dùng chung, chỉ tính phần của bạn; gói trả theo năm được quy ra số tiền mỗi tháng trước. Gói chưa check-in thì chưa có số lần dùng, nên chúng tôi không tự bịa ra chi phí mà hiển thị “Chưa check-in”.",
  },
  "exchange-rate": {
    q: "Gói đăng ký trả bằng đô la được quy đổi sang won thế nào? Tôi có thể đổi tỷ giá không?",
    a: "Gói đăng ký bằng đô la được quy đổi sang won theo tỷ giá hiển thị ở mục “Tỷ giá” trong Cài đặt. Khi để tự động, tỷ giá tự theo tỷ giá tham chiếu của ECB (cập nhật mỗi ngày làm việc một lần); nếu bạn tự nhập trong “Đổi tỷ giá”, giá trị đó sẽ được dùng tiếp. Biên lai đăng ký và bản tổng kết cuối năm, vốn hiển thị các khoản đã thanh toán, dùng tỷ giá tham chiếu của ngày thanh toán chứ không phải tỷ giá hôm nay. Tỷ giá tham chiếu không phải tỷ giá mà công ty thẻ đã tính, nên số tiền có thể hơi khác với sao kê thẻ. Mục “Tỷ giá” chỉ hiện khi bạn có gói đăng ký bằng đô la đang dùng.",
  },
  "checkin-auto": {
    q: "Có thể điền số lần check-in mà không tự đếm không?",
    a: "Trong ứng dụng Android, bật “Kết nối dữ liệu sử dụng điện thoại” trong Cài đặt; khi dữ liệu dùng các ứng dụng đăng ký trên điện thoại này đã đủ 30 ngày, ứng dụng sẽ tự check-in. Trên web ở PC, mở màn hình đọc dữ liệu từ liên kết trong cửa sổ check-in của gói Claude, ChatGPT, Cursor hoặc Google AI, rồi chọn thư mục dữ liệu của công cụ lập trình AI hoặc tệp xuất trò chuyện claude.ai; số ngày đã dùng sẽ được đếm và điền vào cửa sổ check-in. Tệp không được gửi lên máy chủ và chỉ được lưu khi bạn xác nhận. Cách nào cũng chỉ đếm những gì có trên thiết bị hoặc trong tệp đó, nên có thể thấp hơn mức dùng thực tế.",
  },
  "where-stored": {
    q: "Dữ liệu đăng ký của tôi được lưu ở đâu?",
    a: "Mặc định chỉ lưu trên thiết bị này (trong trình duyệt hoặc ứng dụng) và không gửi lên máy chủ. Nếu bạn đăng nhập, dữ liệu cũng được lưu vào tài khoản và tự động đồng bộ với các thiết bị khác đã đăng nhập.",
  },
  "lose-records": {
    q: "Đổi thiết bị hoặc xóa dữ liệu trình duyệt thì có mất dữ liệu không?",
    a: "Nếu chưa đăng nhập thì có thể mất. Hãy đăng nhập trước, hoặc lưu tệp sao lưu trong mục “Sao lưu · Lưu vào tài khoản” ở Cài đặt. Trên thiết bị mới, hãy đăng nhập hoặc tải tệp sao lưu.",
  },
  "social-email-taken": {
    q: "Đăng nhập bằng Google, Kakao hoặc NAVER báo “Tài khoản đã tồn tại”.",
    a: "Nếu email đó đã được dùng để tạo tài khoản trước, chúng tôi không tự động gộp, để người khác không thể vào tài khoản bằng cùng địa chỉ. Hãy đăng nhập bằng cách bạn đăng ký đầu tiên (email và mật khẩu, hoặc cách đăng nhập nhanh bạn dùng đầu tiên), rồi liên kết cách còn lại trong “Cách đăng nhập” ở Thông tin của tôi. Từ đó cách ấy cũng mở cùng một tài khoản. Dữ liệu nằm trong một tài khoản nên không cần gộp hay xóa gì.",
  },
  "delete-records": {
    q: "Làm sao để xóa dữ liệu hoặc rời khỏi dịch vụ?",
    a: "Xóa dữ liệu đăng ký trên thiết bị này bằng “Đặt lại tất cả” trong Cài đặt. Xóa tài khoản bằng “Xóa tài khoản” trong Thông tin của tôi; khi đó dữ liệu trên thiết bị này không bị xóa mà được giữ lại như dữ liệu của người dùng chưa đăng nhập.",
  },
  "cancel-in-app": {
    q: "Tôi có thể hủy ngay trong SubSlash không?",
    a: "Không. Bạn hủy trong từng dịch vụ. SubSlash cung cấp đường dẫn đến nơi hủy và đường đi trong menu. Khi đã hủy xong và nhấn “Tôi đã hủy”, gói được ghi nhận là đã hủy — SubSlash không tự kiểm tra được bạn đã hủy hay chưa.",
  },
  "cancel-button-color": {
    q: "Nút hủy màu đỏ và nút có viền khác nhau thế nào?",
    a: "Nút màu đỏ là đường dẫn đã được xác nhận đi thẳng đến trang hủy. Nút có viền dẫn đến trang chủ hoặc trang tài khoản, sau đó bạn cần làm theo hướng dẫn bên dưới để tìm menu hủy.",
  },
  "store-billing-cancel": {
    q: "Gói trả qua App Store hoặc Google Play thì hủy ở đâu?",
    a: "Hủy ở nơi bạn đã thanh toán. Nếu bạn đặt phương thức thanh toán của gói là “Mua trong ứng dụng Apple App Store” hoặc “Gói đăng ký Google Play”, hướng dẫn hủy sẽ hiển thị màn hình quản lý gói đăng ký đó trước.",
  },
  "billing-reminder": {
    q: "Tôi có nhận được nhắc nhở trước ngày thanh toán không?",
    a: ({ gmailOpen }) =>
      gmailOpen
        ? "Trong ứng dụng, bật “Nhắc thanh toán trên thiết bị này” trong Cài đặt để nhận thông báo trên điện thoại. Trên web, dùng “Thêm ngày thanh toán vào Google Lịch” bên dưới danh sách đăng ký để đưa ngày thanh toán vào lịch dưới dạng sự kiện, rồi lịch sẽ nhắc bạn. Nhắc thanh toán qua email đã ngừng."
        : "Trong ứng dụng, bật “Nhắc thanh toán trên thiết bị này” trong Cài đặt để nhận thông báo trên điện thoại. Nhắc thanh toán qua email đã ngừng.",
  },
  "gmail-unverified": {
    q: "Khi kết nối Gmail, xuất hiện cảnh báo “ứng dụng chưa được xác minh”.",
    a: "Cảnh báo này xuất hiện vì ứng dụng kết nối của SubSlash chưa được Google xét duyệt. Chọn “Nâng cao” để tiếp tục và kết nối. Nếu không muốn thấy cảnh báo, hãy tự cài vào tài khoản của bạn bằng “Tự cài không có cảnh báo (sao chép script)” trên màn hình nhập.",
  },
  "gmail-stored": {
    q: "Nội dung email Gmail của tôi có được lưu trong SubSlash không?",
    a: "Không. Từ email thanh toán, chúng tôi chỉ giữ các ứng viên đăng ký như tên dịch vụ, số tiền và ngày thanh toán, và không bao giờ lưu tiêu đề hay nội dung email. Bạn có thể ngắt kết nối bất cứ lúc nào trên màn hình nhập.",
  },
  "gmail-annual-missing": {
    q: "Gói trả mỗi năm một lần không xuất hiện khi nhập.",
    a: "Khi kết nối Gmail, chúng tôi kiểm tra email 40 ngày gần nhất trước, phần còn lại của năm được kiểm tra trong vài phút sau đó. Hãy mở lại sau một lát. Nếu vẫn không có, nghĩa là không tìm thấy email thanh toán đó, vui lòng tự thêm.",
  },
  "ai-what-is-sent": {
    q: "Khi hỏi AI thì những gì được gửi đi?",
    a: "Chỉ nội dung câu hỏi bạn viết được gửi đến công ty AI. Danh sách đăng ký và số tiền không được gửi — AI chỉ chọn phép tính cần chạy hoặc mục trợ giúp cần hiển thị, còn các con số được tính trên thiết bị này. Vì vậy đừng ghi thông tin cá nhân như tên hay số liên lạc vào câu hỏi.",
  },
  "ai-wrong-answer": {
    q: "AI hiển thị câu trả lời sai.",
    a: "AI chỉ chọn trong các phép tính và mục trợ giúp chúng tôi đã chuẩn bị, nên nếu hiểu sai câu hỏi thì có thể hiển thị phép tính hoặc mục khác. Hãy hỏi lại bằng cách khác hoặc nhấn một nút câu hỏi bên dưới. Nếu vẫn sai, hãy báo cho chúng tôi qua email.",
  },
};

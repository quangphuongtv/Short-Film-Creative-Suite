export interface DefaultScript {
  id: string;
  title: string;
  genre: string;
  brief: string;
  scriptText: string;
}

export const DEFAULT_SCRIPTS: DefaultScript[] = [
   {
    id: "sci_fi_last_key",
    title: "Mật Mã Cuối Cùng (The Last Code)",
    genre: "Sci-Fi / Thriller",
    brief: "Một lập trình viên phát hiện mẩu tin cuối cùng từ lõi AI đang sụp đổ, cố gắng tải nó vào ổ nhớ vật lý trước khi máy chủ bị nổ tung.",
    scriptText: `NỘI THẤT. PHÒNG LAB CHỨA MÁY CHỦ - ĐÊM

Leo (28 tuổi, tóc rối, mặc hoodie đen sờn) gõ phím điên cuồng trên màn hình terminal phát ánh sáng xanh neon. 

Còi báo động hú vang inh ỏi. Đèn khẩn cấp màu đỏ chớp tắt liên tục, rạch vào bóng tối.

LEO
(Hơi thở dồn dập, tự nói với mình)
"Cố lên... chỉ còn 2% thôi! Đừng sập nguồn lúc này!"

Một luồng khói xám bốc ra từ phía sau giá đỡ máy chủ chính với tiếng xèo xèo của linh kiện chập cháy.

Lio giật mình nhìn sang phía khói, rồi nhanh chóng quay lại màn hình. Thanh tiến trình chạy từ 98% lên 99%.

Một tiếng nổ nhỏ vang lên, tia lửa điện bắn tung tóe. Màn hình máy tính mờ đi một nhịp rồi sáng lại.

Màn hình hiển thị chữ: "DOWNLOAD COMPLETE". 

Leo thở phào nhẹ nhõm, nhanh tay rút ổ đĩa cứng thể rắn (SSD) đang phát ánh sáng xanh lam khỏi khay cắm. 

Cậu kẹp ổ đĩa vào ngực, quay lưng lao ra phía cửa thoát hiểm khi trần nhà bắt đầu sụp xuống từng mảng.`
  },
  {
    id: "drama_rain",
    title: "Chuyến Tàu Muộn (The Late Train)",
    genre: "Drama / Romance",
    brief: "Hai người bạn cũ vô tình hội ngộ dưới mái hiên nhà ga trong một đêm mưa tầm tã, nhận ra tình cảm dang dở năm xưa vẫn chưa nguội lạnh.",
    scriptText: `NGOẠI THẤT. NHÀ GA ĐƯỜNG SẮT CỔ - ĐÊM MƯA

Mưa như trút nước xuống mái ngói ga xám xịt. Ánh đèn vàng võ soi bóng nước loang lổ trên sân ga vắng lặng.

Vy (26 tuổi, mặc áo măng tô màu be, tay ôm chiếc ô xếp) đứng co ro tựa lưng vào cột sắt của nhà ga, nhìn ra màn mưa trắng xóa.

Tiếng giày gõ nhịp trên thềm đá ẩm ướt vang lên phía sau. Vy liếc nhẹ sang bên.

An (27 tuổi, khoác balo vải thô bám bụi, tóc ướt sũng) đứng che đầu bằng chiếc tạp chí ẩm ướt, hơi thở tỏa làn sương mỏng trong đêm lạnh.

Vy sững sờ khi nhận ra khuôn mặt thân quen ấy. Cô khẽ gọi tên anh.

VY
(Giọng run run)
"An... là anh đúng không?"

An quay đầu sang, sững người. Ánh mắt hai người chạm nhau qua những giọt mưa rơi xuống thềm nhà ga cổ.`
  },
  {
    id: "cyberpunk_market",
    title: "Chợ Đêm Tương Lai (Cyberpunk Alley)",
    genre: "Cyberpunk / Action",
    brief: "Một lính đánh thuê tìm cách trao đổi kiện hàng dữ liệu sinh học quý giá tại khu chợ đen ẩm ướt đầy ánh đèn holographic rực rỡ.",
    scriptText: `NGOẠI THẤT. SÂN CHỢ ĐEN VÙNG NHÀ GẦN - ĐÊM TỐI RỰC RỠ SẮC MÀU CHROME

Rain (30 tuổi, cánh tay cơ khí lấp lánh ánh thép, khoác hờ áo gió phản quang) bước nhanh qua các sạp hàng thực phẩm tổng hợp nhòe nhoẹt hơi nước. Phía trên đầu, những tấm bảng hologram khổng lồ chiếu bức quảng cáo cá ngừ vây xanh nhân tạo lướt đi vô tận.

Mưa giông trút xuống lấp lánh bụi nước phản chiếu từ đèn neon hồng tím và lam dạ quang nhạt nhòa.

Rain nhìn dáo dác xung quanh, đặt ngón tay lên bộ đàm cấy dưới tai trái.

RAIN
(Nói giọng trầm ấm, căng thẳng)
"Tôi đã đến tọa độ X-12. Phố Chợ Đen ẩm ướt và hỗn loạn quá mức dự tính. Chưa thấy liên lạc viên của tập đoàn Arasaka."

Từ trong lối nhỏ ẩm ước phía sau tiệm mì ăn liền bốc khói, một bóng dáng khoác áo măng tô da bò đội mũ sụp sâu tiến tới. Gương mặt người đó ẩn sau chiếc mặt nạ kỹ thuật số phát sáng hai chữ song song: "DANGER / NGUY HIỂM".`
  }

];

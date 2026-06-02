using System.ComponentModel.DataAnnotations;

namespace danentang.Models
{
    public class Movie
    {
        public int MovieID { get; set; }

        [Required(ErrorMessage = "Tên phim là bắt buộc")]
        public string Title { get; set; } = string.Empty;

        [Range(1, 1000, ErrorMessage = "Thời lượng phải lớn hơn 0")]
        public int Duration { get; set; } // phút

        public DateTime ReleaseDate { get; set; }
        public DateTime EndDate { get; set; }

        public string TrailerURL { get; set; } = string.Empty;
        public string Status { get; set; } = "NowShowing"; // "ComingSoon", "NowShowing", "Ended"
        public string PosterURL { get; set; } = string.Empty;

        [Required(ErrorMessage = "Thể loại phim là bắt buộc")]
        [RegularExpression(@"^(?!\s*$).+", ErrorMessage = "Thể loại phim không được để rỗng")]
        public string Genre { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}

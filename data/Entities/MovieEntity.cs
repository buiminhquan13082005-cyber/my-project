using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    /// <summary>
    /// EF Core entity ánh xạ trực tiếp bảng Movies trong MySQL.
    /// Tách biệt với Model/Movie.cs (DTO) để controller không bị ảnh hưởng.
    /// </summary>
    [Table("Movies")]
    public class MovieEntity
    {
        [Key]
        public int MovieID { get; set; }

        [Required, MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        /// <summary>Thời lượng phim (phút)</summary>
        public int Duration { get; set; }

        [MaxLength(255)]
        public string? Genre { get; set; }

        public string? Description { get; set; }

        public DateTime? ReleaseDate { get; set; }

        public DateTime? EndDate { get; set; }

        /// <summary>ENUM: 'ComingSoon', 'NowShowing', 'Ended'</summary>
        [MaxLength(20)]
        public string Status { get; set; } = "ComingSoon";

        [MaxLength(500)]
        public string? PosterURL { get; set; }

        [MaxLength(500)]
        public string? TrailerURL { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}

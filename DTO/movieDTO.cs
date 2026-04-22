using System;

namespace danentang.DTOs
{
    public class MovieSummaryDTO
    {
        public Guid Id { get; set; }
        public string TitleVietnamese { get; set; }
        public string Slug { get; set; }
        public string PosterUrl { get; set; }
        public int DurationMinutes { get; set; }
        public string AgeRating { get; set; }
    }

    public class MovieCreateDTO
    {
        public string TitleOriginal { get; set; }
        public string TitleVietnamese { get; set; }
        public string Synopsis { get; set; }
        public int DurationMinutes { get; set; }
        public string AgeRating { get; set; }
        public DateTime ReleaseDate { get; set; }
        public DateTime EndDate { get; set; }
        public string PosterUrl { get; set; }
    }
}
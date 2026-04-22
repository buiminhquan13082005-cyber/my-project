using System;

namespace danentang.Models
{
    public class Movie
    {
        public Guid Id { get; set; }
        public string TitleOriginal { get; set; }
        public string TitleVietnamese { get; set; }
        public string Slug { get; set; }
        public string Synopsis { get; set; }
        public int DurationMinutes { get; set; }
        public string AgeRating { get; set; }
        public DateTime ReleaseDate { get; set; }
        public DateTime EndDate { get; set; }
        public string PosterUrl { get; set; }
        public int Status { get; set; }
    }
}
namespace danentang.Models
{
    public class Movie
    {
        public int MovieID { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Duration { get; set; } // phút
        public DateTime ReleaseDate { get; set; }
        public DateTime EndDate { get; set; }
        public string TrailerURL { get; set; } = string.Empty;
        public string Status { get; set; } = "NowShowing"; // "ComingSoon", "NowShowing", "Ended"
        public string PosterURL { get; set; } = string.Empty;
        public string Genre { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}

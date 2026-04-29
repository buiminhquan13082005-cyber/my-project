namespace danentang.Models
{
    public class Equipment
    {
        public int EquipmentID { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // "LinhKienDienTu", "GheNgoi", "MayChieu", "Loa", "MayLamNuoc", "MayBong"
        public string TechnicalSpecs { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty; // "Cái", "Bộ", "Chiếc"
    }
}

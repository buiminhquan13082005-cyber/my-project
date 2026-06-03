using Microsoft.EntityFrameworkCore;
using danentang.Data.Entities;

namespace danentang.Data
{
    public class CinemaDbContext : DbContext
    {
        public CinemaDbContext(DbContextOptions<CinemaDbContext> options) : base(options)
        {
        }

        public DbSet<MovieEntity> Movies { get; set; }
        public DbSet<RoomEntity> Rooms { get; set; }
        public DbSet<SeatEntity> Seats { get; set; }
        public DbSet<ShowtimeEntity> Showtimes { get; set; }
        public DbSet<BookingEntity> Bookings { get; set; }
        
        // New DbSets for Warehouse, Equipment, Auth, Attendance modules
        public DbSet<UserEntity> Users { get; set; }
        public DbSet<RefreshTokenEntity> RefreshTokens { get; set; }
        public DbSet<AttendanceEntity> Attendances { get; set; }
        public DbSet<EquipmentEntity> Equipments { get; set; }
        public DbSet<EquipmentScheduleEntity> EquipmentSchedules { get; set; }
        public DbSet<EquipmentStorageEntity> EquipmentStorages { get; set; }
        public DbSet<IncidentEntity> Incidents { get; set; }
        public DbSet<InventoryCheckEntity> InventoryChecks { get; set; }
        public DbSet<MaintenanceRequestEntity> MaintenanceRequests { get; set; }
        public DbSet<MaintenanceLogEntity> MaintenanceLogs { get; set; }
        public DbSet<StockTransactionEntity> StockTransactions { get; set; }
        
        // Keyless Entity cho View
        public DbSet<VwBookingDetailEntity> VwBookingDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình View (Keyless Entity)
            modelBuilder.Entity<VwBookingDetailEntity>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_BookingDetails");
            });
            
            // Cấu hình UNIQUE constraint cho Seats (RoomID, SeatRow, SeatNumber)
            modelBuilder.Entity<SeatEntity>()
                .HasIndex(s => new { s.RoomID, s.SeatRow, s.SeatNumber })
                .IsUnique()
                .HasDatabaseName("uq_seat_position");

            // Cấu hình UNIQUE constraint cho Showtimes (RoomID, StartTime)
            modelBuilder.Entity<ShowtimeEntity>()
                .HasIndex(s => new { s.RoomID, s.StartTime })
                .IsUnique()
                .HasDatabaseName("uq_showtime_room_start");

            // Cấu hình UNIQUE constraint cho Bookings (ShowtimeID, SeatID)
            modelBuilder.Entity<BookingEntity>()
                .HasIndex(b => new { b.ShowtimeID, b.SeatID })
                .IsUnique()
                .HasDatabaseName("uq_booking_seat_showtime");
        }
    }
}

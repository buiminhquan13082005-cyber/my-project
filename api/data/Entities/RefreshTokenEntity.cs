using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("RefreshTokens")]
    public class RefreshTokenEntity
    {
        [Key]
        [MaxLength(255)]
        public string Token { get; set; } = string.Empty;

        [Required]
        public int UserId { get; set; }

        [Required]
        public DateTime ExpiresAt { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool IsRevoked { get; set; } = false;

        [ForeignKey("UserId")]
        public virtual UserEntity? User { get; set; }
    }
}

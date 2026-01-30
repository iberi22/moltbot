class LogEntry {
  final String raw;
  final String? time;
  final String? level;
  final String? subsystem;
  final String? message;

  LogEntry({
    required this.raw,
    this.time,
    this.level,
    this.subsystem,
    this.message,
  });

  factory LogEntry.fromJson(Map<String, dynamic> json) {
    return LogEntry(
      raw: json['raw'] as String,
      time: json['time'] as String?,
      level: json['level'] as String?,
      subsystem: json['subsystem'] as String?,
      message: json['message'] as String?,
    );
  }
}

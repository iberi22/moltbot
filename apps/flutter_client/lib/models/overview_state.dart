class OverviewState {
  final List<dynamic> presence;
  final Map<String, dynamic>? channels;
  final bool loading;
  final String? error;

  OverviewState({
    this.presence = const [],
    this.channels,
    this.loading = false,
    this.error,
  });

  OverviewState copyWith({
    List<dynamic>? presence,
    Map<String, dynamic>? channels,
    bool? loading,
    String? error,
  }) {
    return OverviewState(
      presence: presence ?? this.presence,
      channels: channels ?? this.channels,
      loading: loading ?? this.loading,
      error: error ?? this.error,
    );
  }
}

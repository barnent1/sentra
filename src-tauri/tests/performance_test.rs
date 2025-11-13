/**
 * Performance Module Tests
 *
 * Tests for Rust performance tracking.
 * Following TDD approach - tests written FIRST before implementation.
 */

#[cfg(test)]
mod performance_tests {
    use app_lib::performance::{
        PerformanceTracker, Measurement, CommandMetric, FileOperationMetric,
    };
    use std::time::Duration;

    #[test]
    fn test_tracker_initialization() {
        let tracker = PerformanceTracker::new();
        let metrics = tracker.get_metrics();

        assert_eq!(metrics.command_executions.len(), 0);
        assert_eq!(metrics.file_operations.len(), 0);
    }

    #[test]
    fn test_track_command_execution() {
        let tracker = PerformanceTracker::new();

        tracker.track_command("get_projects", Duration::from_millis(45));

        let metrics = tracker.get_metrics();
        assert_eq!(metrics.command_executions.len(), 1);

        let cmd = &metrics.command_executions[0];
        assert_eq!(cmd.command_name, "get_projects");
        assert_eq!(cmd.duration_ms, 45);
    }

    #[test]
    fn test_track_multiple_commands() {
        let tracker = PerformanceTracker::new();

        tracker.track_command("get_projects", Duration::from_millis(45));
        tracker.track_command("save_settings", Duration::from_millis(12));
        tracker.track_command("get_dashboard_stats", Duration::from_millis(78));

        let metrics = tracker.get_metrics();
        assert_eq!(metrics.command_executions.len(), 3);
    }

    #[test]
    fn test_track_file_operation() {
        let tracker = PerformanceTracker::new();

        tracker.track_file_operation(
            "read",
            "/path/to/file.txt",
            Duration::from_millis(15),
            1024,
        );

        let metrics = tracker.get_metrics();
        assert_eq!(metrics.file_operations.len(), 1);

        let op = &metrics.file_operations[0];
        assert_eq!(op.operation_type, "read");
        assert_eq!(op.file_path, "/path/to/file.txt");
        assert_eq!(op.duration_ms, 15);
        assert_eq!(op.bytes, 1024);
    }

    #[test]
    fn test_detect_slow_commands() {
        let tracker = PerformanceTracker::new();

        tracker.track_command("fast_command", Duration::from_millis(50));
        tracker.track_command("slow_command", Duration::from_millis(250));
        tracker.track_command("another_fast", Duration::from_millis(30));

        let slow_ops = tracker.get_slow_operations(100);

        assert_eq!(slow_ops.len(), 1);
        assert_eq!(slow_ops[0].name, "slow_command");
        assert_eq!(slow_ops[0].duration_ms, 250);
    }

    #[test]
    fn test_detect_slow_file_operations() {
        let tracker = PerformanceTracker::new();

        tracker.track_file_operation("read", "/fast/file.txt", Duration::from_millis(25), 1024);
        tracker.track_file_operation(
            "write",
            "/slow/file.txt",
            Duration::from_millis(180),
            4096,
        );

        let slow_ops = tracker.get_slow_operations(100);

        assert_eq!(slow_ops.len(), 1);
        assert_eq!(slow_ops[0].name, "write:/slow/file.txt");
        assert_eq!(slow_ops[0].duration_ms, 180);
    }

    #[test]
    fn test_slow_operations_sorted_by_duration() {
        let tracker = PerformanceTracker::new();

        tracker.track_command("cmd1", Duration::from_millis(150));
        tracker.track_command("cmd2", Duration::from_millis(300));
        tracker.track_command("cmd3", Duration::from_millis(200));

        let slow_ops = tracker.get_slow_operations(100);

        assert_eq!(slow_ops.len(), 3);
        assert_eq!(slow_ops[0].duration_ms, 300); // Highest first
        assert_eq!(slow_ops[1].duration_ms, 200);
        assert_eq!(slow_ops[2].duration_ms, 150);
    }

    #[test]
    fn test_limit_slow_operations_count() {
        let tracker = PerformanceTracker::new();

        for i in 0..10 {
            tracker.track_command(
                &format!("cmd{}", i),
                Duration::from_millis(150 + i * 10),
            );
        }

        let slow_ops = tracker.get_slow_operations_with_limit(100, 5);

        assert_eq!(slow_ops.len(), 5);
    }

    #[test]
    fn test_get_command_stats() {
        let tracker = PerformanceTracker::new();

        tracker.track_command("get_projects", Duration::from_millis(50));
        tracker.track_command("get_projects", Duration::from_millis(70));
        tracker.track_command("get_projects", Duration::from_millis(60));

        let stats = tracker.get_command_stats("get_projects");

        assert_eq!(stats.count, 3);
        assert_eq!(stats.average_ms, 60); // (50 + 70 + 60) / 3
        assert_eq!(stats.min_ms, 50);
        assert_eq!(stats.max_ms, 70);
    }

    #[test]
    fn test_command_stats_no_data() {
        let tracker = PerformanceTracker::new();

        let stats = tracker.get_command_stats("non_existent_command");

        assert_eq!(stats.count, 0);
        assert_eq!(stats.average_ms, 0);
        assert_eq!(stats.min_ms, 0);
        assert_eq!(stats.max_ms, 0);
    }

    #[test]
    fn test_clear_metrics() {
        let tracker = PerformanceTracker::new();

        tracker.track_command("get_projects", Duration::from_millis(45));
        tracker.track_file_operation("read", "/file.txt", Duration::from_millis(15), 1024);

        tracker.clear();

        let metrics = tracker.get_metrics();
        assert_eq!(metrics.command_executions.len(), 0);
        assert_eq!(metrics.file_operations.len(), 0);
    }

    #[test]
    fn test_export_metrics() {
        let tracker = PerformanceTracker::new();

        tracker.track_command("get_projects", Duration::from_millis(45));
        tracker.track_file_operation("read", "/file.txt", Duration::from_millis(15), 1024);

        let exported = tracker.export_metrics();

        assert!(exported.command_executions.len() > 0);
        assert!(exported.file_operations.len() > 0);
        assert!(exported.exported_at.len() > 0);
    }

    #[test]
    fn test_measure_command_decorator() {
        let tracker = PerformanceTracker::new();

        let result = tracker.measure_command("test_operation", || {
            std::thread::sleep(Duration::from_millis(10));
            42
        });

        assert_eq!(result, 42);

        let metrics = tracker.get_metrics();
        assert_eq!(metrics.command_executions.len(), 1);
        assert_eq!(metrics.command_executions[0].command_name, "test_operation");
        assert!(metrics.command_executions[0].duration_ms >= 10);
    }

    #[test]
    fn test_measure_command_with_error() {
        let tracker = PerformanceTracker::new();

        let result = std::panic::catch_unwind(|| {
            tracker.measure_command("failing_operation", || {
                panic!("Test error");
            })
        });

        assert!(result.is_err());

        // Should still record the measurement
        let metrics = tracker.get_metrics();
        assert_eq!(metrics.command_executions.len(), 1);
    }

    #[test]
    fn test_file_operation_throughput() {
        let tracker = PerformanceTracker::new();

        // 1MB in 100ms = 10MB/s
        tracker.track_file_operation(
            "read",
            "/file.txt",
            Duration::from_millis(100),
            1024 * 1024,
        );

        let metrics = tracker.get_metrics();
        let op = &metrics.file_operations[0];

        let throughput_mb_per_sec = (op.bytes as f64 / (1024.0 * 1024.0)) / (op.duration_ms as f64 / 1000.0);

        assert!((throughput_mb_per_sec - 10.0).abs() < 0.1);
    }

    #[test]
    fn test_concurrent_tracking() {
        use std::sync::Arc;
        use std::thread;

        let tracker = Arc::new(PerformanceTracker::new());
        let mut handles = vec![];

        for i in 0..10 {
            let tracker_clone = Arc::clone(&tracker);
            let handle = thread::spawn(move || {
                tracker_clone.track_command(
                    &format!("cmd{}", i),
                    Duration::from_millis(10),
                );
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap();
        }

        let metrics = tracker.get_metrics();
        assert_eq!(metrics.command_executions.len(), 10);
    }

    #[test]
    fn test_timestamps_are_recorded() {
        let tracker = PerformanceTracker::new();

        let before = std::time::SystemTime::now();
        tracker.track_command("test_command", Duration::from_millis(10));
        let after = std::time::SystemTime::now();

        let metrics = tracker.get_metrics();
        let cmd = &metrics.command_executions[0];

        // Timestamp should be between before and after
        assert!(cmd.timestamp >= before);
        assert!(cmd.timestamp <= after);
    }

    #[test]
    fn test_zero_performance_impact_when_disabled() {
        let tracker = PerformanceTracker::new_disabled();

        // Should not track anything
        tracker.track_command("test_command", Duration::from_millis(100));
        tracker.track_file_operation("read", "/file.txt", Duration::from_millis(50), 1024);

        let metrics = tracker.get_metrics();
        assert_eq!(metrics.command_executions.len(), 0);
        assert_eq!(metrics.file_operations.len(), 0);
    }

    #[test]
    fn test_enable_disable_toggle() {
        let tracker = PerformanceTracker::new();

        tracker.track_command("cmd1", Duration::from_millis(10));

        tracker.disable();
        tracker.track_command("cmd2", Duration::from_millis(10));

        tracker.enable();
        tracker.track_command("cmd3", Duration::from_millis(10));

        let metrics = tracker.get_metrics();
        // Should only have cmd1 and cmd3
        assert_eq!(metrics.command_executions.len(), 2);
    }
}

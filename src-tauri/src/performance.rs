/**
 * Performance Tracking Module
 *
 * Tracks Rust command execution times, file operations, and monitors
 * for slow operations. Exports metrics to frontend for visualization.
 */

use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandMetric {
    pub command_name: String,
    pub duration_ms: u64,
    pub timestamp: SystemTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileOperationMetric {
    pub operation_type: String,
    pub file_path: String,
    pub duration_ms: u64,
    pub bytes: u64,
    pub timestamp: SystemTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlowOperation {
    pub name: String,
    pub duration_ms: u64,
    pub op_type: String,
    pub timestamp: SystemTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub command_executions: Vec<CommandMetric>,
    pub file_operations: Vec<FileOperationMetric>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandStats {
    pub count: usize,
    pub average_ms: u64,
    pub min_ms: u64,
    pub max_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceExport {
    pub command_executions: Vec<CommandMetric>,
    pub file_operations: Vec<FileOperationMetric>,
    pub exported_at: String,
}

const SLOW_THRESHOLD_MS: u64 = 100;

pub struct PerformanceTracker {
    enabled: Arc<Mutex<bool>>,
    command_executions: Arc<Mutex<Vec<CommandMetric>>>,
    file_operations: Arc<Mutex<Vec<FileOperationMetric>>>,
}

impl PerformanceTracker {
    pub fn new() -> Self {
        Self {
            enabled: Arc::new(Mutex::new(cfg!(debug_assertions))),
            command_executions: Arc::new(Mutex::new(Vec::new())),
            file_operations: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn new_disabled() -> Self {
        Self {
            enabled: Arc::new(Mutex::new(false)),
            command_executions: Arc::new(Mutex::new(Vec::new())),
            file_operations: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn enable(&self) {
        if let Ok(mut enabled) = self.enabled.lock() {
            *enabled = true;
        }
    }

    pub fn disable(&self) {
        if let Ok(mut enabled) = self.enabled.lock() {
            *enabled = false;
        }
    }

    fn is_enabled(&self) -> bool {
        self.enabled.lock().map(|e| *e).unwrap_or(false)
    }

    pub fn track_command(&self, command_name: &str, duration: Duration) {
        if !self.is_enabled() {
            return;
        }

        let metric = CommandMetric {
            command_name: command_name.to_string(),
            duration_ms: duration.as_millis() as u64,
            timestamp: SystemTime::now(),
        };

        if let Ok(mut commands) = self.command_executions.lock() {
            commands.push(metric);
        }
    }

    pub fn track_file_operation(
        &self,
        operation_type: &str,
        file_path: &str,
        duration: Duration,
        bytes: u64,
    ) {
        if !self.is_enabled() {
            return;
        }

        let metric = FileOperationMetric {
            operation_type: operation_type.to_string(),
            file_path: file_path.to_string(),
            duration_ms: duration.as_millis() as u64,
            bytes,
            timestamp: SystemTime::now(),
        };

        if let Ok(mut operations) = self.file_operations.lock() {
            operations.push(metric);
        }
    }

    pub fn measure_command<F, R>(&self, command_name: &str, f: F) -> R
    where
        F: FnOnce() -> R,
    {
        let start = Instant::now();
        let result = f();
        let duration = start.elapsed();

        self.track_command(command_name, duration);

        result
    }

    pub fn get_metrics(&self) -> PerformanceMetrics {
        PerformanceMetrics {
            command_executions: self
                .command_executions
                .lock()
                .map(|c| c.clone())
                .unwrap_or_default(),
            file_operations: self
                .file_operations
                .lock()
                .map(|f| f.clone())
                .unwrap_or_default(),
        }
    }

    pub fn get_slow_operations(&self, threshold_ms: u64) -> Vec<SlowOperation> {
        self.get_slow_operations_with_limit(threshold_ms, 50)
    }

    pub fn get_slow_operations_with_limit(
        &self,
        threshold_ms: u64,
        limit: usize,
    ) -> Vec<SlowOperation> {
        let mut slow_ops = Vec::new();

        // Add slow command executions
        if let Ok(commands) = self.command_executions.lock() {
            for cmd in commands.iter() {
                if cmd.duration_ms >= threshold_ms {
                    slow_ops.push(SlowOperation {
                        name: cmd.command_name.clone(),
                        duration_ms: cmd.duration_ms,
                        op_type: "command".to_string(),
                        timestamp: cmd.timestamp,
                    });
                }
            }
        }

        // Add slow file operations
        if let Ok(operations) = self.file_operations.lock() {
            for op in operations.iter() {
                if op.duration_ms >= threshold_ms {
                    slow_ops.push(SlowOperation {
                        name: format!("{}:{}", op.operation_type, op.file_path),
                        duration_ms: op.duration_ms,
                        op_type: "file".to_string(),
                        timestamp: op.timestamp,
                    });
                }
            }
        }

        // Sort by duration descending
        slow_ops.sort_by(|a, b| b.duration_ms.cmp(&a.duration_ms));

        // Limit results
        slow_ops.truncate(limit);

        slow_ops
    }

    pub fn get_command_stats(&self, command_name: &str) -> CommandStats {
        if let Ok(commands) = self.command_executions.lock() {
            let matching: Vec<&CommandMetric> = commands
                .iter()
                .filter(|c| c.command_name == command_name)
                .collect();

            if matching.is_empty() {
                return CommandStats {
                    count: 0,
                    average_ms: 0,
                    min_ms: 0,
                    max_ms: 0,
                };
            }

            let durations: Vec<u64> = matching.iter().map(|c| c.duration_ms).collect();
            let sum: u64 = durations.iter().sum();
            let count = durations.len();

            CommandStats {
                count,
                average_ms: sum / count as u64,
                min_ms: *durations.iter().min().unwrap_or(&0),
                max_ms: *durations.iter().max().unwrap_or(&0),
            }
        } else {
            CommandStats {
                count: 0,
                average_ms: 0,
                min_ms: 0,
                max_ms: 0,
            }
        }
    }

    pub fn export_metrics(&self) -> PerformanceExport {
        let metrics = self.get_metrics();

        PerformanceExport {
            command_executions: metrics.command_executions,
            file_operations: metrics.file_operations,
            exported_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    pub fn clear(&self) {
        if let Ok(mut commands) = self.command_executions.lock() {
            commands.clear();
        }
        if let Ok(mut operations) = self.file_operations.lock() {
            operations.clear();
        }
    }
}

impl Default for PerformanceTracker {
    fn default() -> Self {
        Self::new()
    }
}

// Global singleton instance
lazy_static::lazy_static! {
    static ref GLOBAL_TRACKER: PerformanceTracker = PerformanceTracker::new();
}

pub fn get_global_tracker() -> &'static PerformanceTracker {
    &GLOBAL_TRACKER
}

// Tauri command to export metrics to frontend
#[tauri::command]
pub fn get_performance_metrics() -> PerformanceMetrics {
    get_global_tracker().get_metrics()
}

#[tauri::command]
pub fn get_slow_operations_command(threshold_ms: Option<u64>) -> Vec<SlowOperation> {
    let threshold = threshold_ms.unwrap_or(SLOW_THRESHOLD_MS);
    get_global_tracker().get_slow_operations(threshold)
}

#[tauri::command]
pub fn clear_performance_metrics() {
    get_global_tracker().clear();
}

// Macro for easy command performance tracking
#[macro_export]
macro_rules! track_command {
    ($name:expr, $block:expr) => {{
        let tracker = $crate::performance::get_global_tracker();
        tracker.measure_command($name, || $block)
    }};
}

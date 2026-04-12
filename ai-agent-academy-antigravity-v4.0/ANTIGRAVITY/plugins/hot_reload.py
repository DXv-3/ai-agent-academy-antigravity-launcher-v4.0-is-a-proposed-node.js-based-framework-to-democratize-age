#!/usr/bin/env python3
"""
ANTIGRAVITY Plugin Hot Reload System
Provides state preservation, file watching, and rollback capabilities for plugins.
"""

import os
import sys
import json
import hashlib
import time
import threading
import importlib
import importlib.util
from pathlib import Path
from typing import Any, Callable, Dict, Optional, List
from dataclasses import dataclass, field, asdict
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO, format='[HotReload] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


class ReloadStrategy(Enum):
    IMMEDIATE = "immediate"
    DEBOUNCED = "debounced"
    MANUAL = "manual"


@dataclass
class PluginState:
    """Captures the complete state of a plugin for preservation."""
    plugin_id: str
    version: str
    state_data: Dict[str, Any]
    timestamp: float
    checksum: str

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> 'PluginState':
        return cls(**data)


@dataclass
class PluginSnapshot:
    """A snapshot of plugin code for rollback capability."""
    plugin_id: str
    version: str
    file_path: str
    code_hash: str
    code: str
    timestamp: float

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> 'PluginSnapshot':
        return cls(**data)


class StateManager:
    """Manages plugin state preservation and restoration."""

    def __init__(self, storage_dir: str = ".antigravity/plugin_states"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._states: Dict[str, PluginState] = {}
        self._load_states()

    def _load_states(self):
        """Load persisted states from disk."""
        for state_file in self.storage_dir.glob("*.json"):
            try:
                with open(state_file) as f:
                    state = PluginState.from_dict(json.load(f))
                    self._states[state.plugin_id] = state
            except Exception as e:
                logger.warning(f"Failed to load state from {state_file}: {e}")

    def _state_file_path(self, plugin_id: str) -> Path:
        return self.storage_dir / f"{plugin_id}.json"

    def save_state(self, plugin_id: str, version: str, state_data: Dict[str, Any]) -> PluginState:
        """Save plugin state to memory and disk."""
        state = PluginState(
            plugin_id=plugin_id,
            version=version,
            state_data=state_data,
            timestamp=time.time(),
            checksum=self._compute_checksum(state_data)
        )
        self._states[plugin_id] = state
        
        with open(self._state_file_path(plugin_id), 'w') as f:
            json.dump(state.to_dict(), f, indent=2)
        
        logger.info(f"Saved state for plugin {plugin_id} v{version}")
        return state

    def get_state(self, plugin_id: str) -> Optional[PluginState]:
        """Retrieve saved state for a plugin."""
        return self._states.get(plugin_id)

    def restore_state(self, plugin_id: str) -> Optional[Dict[str, Any]]:
        """Get state data ready for restoration."""
        state = self.get_state(plugin_id)
        if state:
            logger.info(f"Restored state for plugin {plugin_id} v{state.version}")
            return state.state_data
        return None

    def _compute_checksum(self, data: Dict) -> str:
        return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]


class SnapshotManager:
    """Manages plugin code snapshots for rollback."""

    def __init__(self, storage_dir: str = ".antigravity/plugin_snapshots", max_snapshots: int = 10):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.max_snapshots = max_snapshots
        self._snapshots: Dict[str, List[PluginSnapshot]] = {}

    def save_snapshot(self, plugin_id: str, version: str, file_path: str, code: str) -> PluginSnapshot:
        """Save a snapshot of plugin code."""
        snapshot = PluginSnapshot(
            plugin_id=plugin_id,
            version=version,
            file_path=file_path,
            code_hash=hashlib.sha256(code.encode()).hexdigest(),
            code=code,
            timestamp=time.time()
        )
        
        if plugin_id not in self._snapshots:
            self._snapshots[plugin_id] = []
        
        self._snapshots[plugin_id].append(snapshot)
        
        if len(self._snapshots[plugin_id]) > self.max_snapshots:
            self._snapshots[plugin_id].pop(0)
        
        logger.info(f"Saved snapshot for plugin {plugin_id} v{version}")
        return snapshot

    def get_latest_snapshot(self, plugin_id: str) -> Optional[PluginSnapshot]:
        """Get the most recent snapshot."""
        snapshots = self._snapshots.get(plugin_id, [])
        return snapshots[-1] if snapshots else None

    def rollback(self, plugin_id: str) -> Optional[str]:
        """Rollback to previous snapshot, returning the code."""
        snapshots = self._snapshots.get(plugin_id, [])
        if len(snapshots) < 2:
            logger.warning(f"No previous snapshot to rollback to for {plugin_id}")
            return None
        
        previous = snapshots[-2]
        logger.info(f"Rolling back plugin {plugin_id} to v{previous.version}")
        return previous.code


class FileWatcher:
    """Watches plugin files for changes using polling."""

    def __init__(self, watch_paths: List[str], callback: Callable[[str], None], 
                 interval: float = 1.0, debounce: float = 0.5):
        self.watch_paths = [Path(p) for p in watch_paths]
        self.callback = callback
        self.interval = interval
        self.debounce = debounce
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._file_mtimes: Dict[str, float] = {}
        self._last_trigger_time: float = 0

    def start(self):
        """Start watching for file changes."""
        if self._running:
            return
        
        self._running = True
        self._update_mtimes()
        self._thread = threading.Thread(target=self._watch_loop, daemon=True)
        self._thread.start()
        logger.info(f"Started watching {len(self.watch_paths)} paths")

    def stop(self):
        """Stop watching for file changes."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
        logger.info("Stopped file watcher")

    def _update_mtimes(self):
        """Update modification times for all watched files."""
        for watch_path in self.watch_paths:
            if watch_path.is_file():
                try:
                    self._file_mtimes[str(watch_path)] = watch_path.stat().st_mtime
                except OSError:
                    pass
            elif watch_path.is_dir():
                for file_path in watch_path.rglob("*.py"):
                    try:
                        self._file_mtimes[str(file_path)] = file_path.stat().st_mtime
                    except OSError:
                        pass

    def _watch_loop(self):
        """Main watch loop running in separate thread."""
        while self._running:
            time.sleep(self.interval)
            
            changes = []
            current_mtimes = {}
            
            for watch_path in self.watch_paths:
                if watch_path.is_file():
                    files = [watch_path]
                elif watch_path.is_dir():
                    files = list(watch_path.rglob("*.py"))
                else:
                    continue
                
                for file_path in files:
                    try:
                        mtime = file_path.stat().st_mtime
                        current_mtimes[str(file_path)] = mtime
                        
                        if str(file_path) not in self._file_mtimes:
                            changes.append(str(file_path))
                        elif self._file_mtimes[str(file_path)] != mtime:
                            changes.append(str(file_path))
                    except OSError:
                        pass
            
            self._file_mtimes = current_mtimes
            
            if changes:
                now = time.time()
                if now - self._last_trigger_time >= self.debounce:
                    self._last_trigger_time = now
                    for changed_file in changes:
                        try:
                            self.callback(changed_file)
                        except Exception as e:
                            logger.error(f"Callback error for {changed_file}: {e}")


class HotReloadManager:
    """Main hot reload orchestrator."""

    def __init__(self, plugins_dir: str = "ANTIGRAVITY/plugins", 
                 strategy: ReloadStrategy = ReloadStrategy.DEBOUNCED,
                 debounce_delay: float = 0.5):
        self.plugins_dir = Path(plugins_dir)
        self.strategy = strategy
        self.debounce_delay = debounce_delay
        
        self.state_manager = StateManager()
        self.snapshot_manager = SnapshotManager()
        self.file_watcher: Optional[FileWatcher] = None
        
        self._plugins: Dict[str, Any] = {}
        self._reload_handlers: Dict[str, Callable] = {}
        self._callbacks: List[Callable] = []

    def register_plugin(self, plugin_id: str, version: str = "1.0.0"):
        """Register a plugin for hot reload."""
        plugin_file = self.plugins_dir / f"{plugin_id}.py"
        
        if not plugin_file.exists():
            logger.warning(f"Plugin file not found: {plugin_file}")
            return
        
        with open(plugin_file) as f:
            code = f.read()
        
        self.snapshot_manager.save_snapshot(plugin_id, version, str(plugin_file), code)
        logger.info(f"Registered plugin {plugin_id} v{version} for hot reload")

    def on_reload(self, plugin_id: str, handler: Callable[[Dict], None]):
        """Register a callback to be called on plugin reload."""
        self._reload_handlers[plugin_id] = handler

    def add_reload_callback(self, callback: Callable[[str, str], None]):
        """Add a general reload callback (plugin_id, event)."""
        self._callbacks.append(callback)

    def start_watching(self):
        """Start the file watcher."""
        if not self.plugins_dir.exists():
            logger.warning(f"Plugins directory not found: {self.plugins_dir}")
            return
        
        self.file_watcher = FileWatcher(
            watch_paths=[str(self.plugins_dir)],
            callback=self._handle_file_change,
            debounce=self.debounce_delay
        )
        self.file_watcher.start()

    def stop_watching(self):
        """Stop the file watcher."""
        if self.file_watcher:
            self.file_watcher.stop()

    def _handle_file_change(self, changed_file: str):
        """Handle a file change event."""
        plugin_id = Path(changed_file).stem
        logger.info(f"Detected change in {changed_file}")
        
        self.reload_plugin(plugin_id)

    def reload_plugin(self, plugin_id: str, force: bool = False) -> bool:
        """Reload a specific plugin with state preservation."""
        plugin_file = self.plugins_dir / f"{plugin_id}.py"
        
        if not plugin_file.exists():
            logger.error(f"Plugin file not found: {plugin_file}")
            return False
        
        try:
            saved_state = self.state_manager.get_state(plugin_id)
            
            with open(plugin_file) as f:
                new_code = f.read()
            
            new_hash = hashlib.sha256(new_code.encode()).hexdigest()
            
            if not force:
                latest_snapshot = self.snapshot_manager.get_latest_snapshot(plugin_id)
                if latest_snapshot and latest_snapshot.code_hash == new_hash:
                    logger.debug(f"No actual code change in {plugin_id}")
                    return True
            
            self.snapshot_manager.save_snapshot(
                plugin_id, 
                f"reload-{int(time.time())}",
                str(plugin_file), 
                new_code
            )
            
            try:
                module = self._load_plugin_module(plugin_id, plugin_file)
                if module is None:
                    logger.error(f"Failed to load module for {plugin_id}")
                    return False
            except Exception as e:
                logger.error(f"Failed to reload {plugin_id}: {e}")
                
                rollback_code = self.snapshot_manager.rollback(plugin_id)
                if rollback_code:
                    logger.info(f"Rolling back {plugin_id} to previous version")
                    temp_file = plugin_file.with_suffix('.py.bak')
                    try:
                        with open(temp_file, 'w') as f:
                            f.write(rollback_code)
                        module = self._load_plugin_module(plugin_id, temp_file)
                        if module:
                            logger.info(f"Successfully rolled back {plugin_id}")
                            temp_file.unlink()
                    except Exception as rollback_error:
                        logger.error(f"Rollback failed: {rollback_error}")
                        if temp_file.exists():
                            temp_file.unlink()
                return False
            
            if saved_state:
                restore_handler = self._reload_handlers.get(plugin_id)
                if restore_handler:
                    try:
                        restore_handler(saved_state.state_data)
                    except Exception as e:
                        logger.error(f"State restoration failed for {plugin_id}: {e}")
            
            for callback in self._callbacks:
                try:
                    callback(plugin_id, "reloaded")
                except Exception as e:
                    logger.error(f"Callback error: {e}")
            
            logger.info(f"Successfully reloaded plugin {plugin_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error reloading plugin {plugin_id}: {e}")
            return False

    def _load_plugin_module(self, plugin_id: str, plugin_file: Path) -> Optional[Any]:
        """Dynamically load a plugin module."""
        spec = importlib.util.spec_from_file_location(plugin_id, plugin_file)
        if spec and spec.loader:
            module = importlib.util.module_from_spec(spec)
            sys.modules[plugin_id] = module
            spec.loader.exec_module(module)
            self._plugins[plugin_id] = module
            return module
        return None

    def get_plugin(self, plugin_id: str) -> Optional[Any]:
        """Get a loaded plugin instance."""
        return self._plugins.get(plugin_id)

    def save_plugin_state(self, plugin_id: str, state_data: Dict[str, Any], version: str = "1.0.0"):
        """Manually save plugin state."""
        self.state_manager.save_state(plugin_id, version, state_data)

    def get_status(self) -> Dict:
        """Get hot reload system status."""
        return {
            "watching": self.file_watcher._running if self.file_watcher else False,
            "strategy": self.strategy.value,
            "loaded_plugins": list(self._plugins.keys()),
            "tracked_plugins": list(self.snapshot_manager._snapshots.keys()),
        }


class PluginReloader:
    """Convenience class for per-plugin hot reloading."""

    def __init__(self, plugin_id: str, plugins_dir: str = "ANTIGRAVITY/plugins"):
        self.plugin_id = plugin_id
        self.plugins_dir = Path(plugins_dir)
        self.manager = None

    def __enter__(self):
        self.manager = HotReloadManager(
            plugins_dir=str(self.plugins_dir.parent),
            strategy=ReloadStrategy.IMMEDIATE
        )
        self.manager.register_plugin(self.plugin_id)
        self.manager.start_watching()
        return self.manager

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.manager:
            self.manager.stop_watching()


def create_hot_reload(plugins_dir: str = "ANTIGRAVITY/plugins") -> HotReloadManager:
    """Factory function to create a hot reload manager."""
    return HotReloadManager(plugins_dir=plugins_dir)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ANTIGRAVITY Hot Reload System")
    parser.add_argument("--plugins-dir", default="ANTIGRAVITY/plugins", help="Plugins directory")
    parser.add_argument("--strategy", choices=["immediate", "debounced", "manual"], default="debounced")
    parser.add_argument("--watch", action="store_true", help="Start watching for changes")
    parser.add_argument("--status", action="store_true", help="Show current status")
    
    args = parser.parse_args()

    manager = HotReloadManager(
        plugins_dir=args.plugins_dir,
        strategy=ReloadStrategy(args.strategy)
    )

    if args.status:
        print(json.dumps(manager.get_status(), indent=2))
    elif args.watch:
        print(f"Starting hot reload manager for {args.plugins_dir}...")
        print(f"Strategy: {args.strategy}")
        manager.start_watching()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping hot reload...")
            manager.stop_watching()
    else:
        print("Use --watch to start watching or --status to see status")
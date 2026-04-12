"""
Compat layer for legacy agents.

Provides backwards compatibility for older agent implementations,
ensuring smooth migration to the new plugin system.
"""

import warnings
from typing import Any, Callable, Dict, Optional
from functools import wraps


class LegacyAgentAdapter:
    """Adapter for legacy agent implementations."""
    
    def __init__(
        self,
        agent_class: Callable[[Dict[str, Any]], Any],
        deprecation_warning: str = "This agent class is deprecated. Please migrate to the new plugin system."
    ):
        self._agent_class = agent_class
        self._deprecation_warning = deprecation_warning
        warnings.warn(deprecation_warning, DeprecationWarning, stacklevel=2)
    
    def create(self, config: Optional[Dict[str, Any]] = None) -> Any:
        """Create an instance of the legacy agent."""
        config = config or {}
        return self._agent_class(config)
    
    def execute(self, agent_instance: Any, task: str) -> Any:
        """Execute a task using the legacy agent."""
        if hasattr(agent_instance, 'run'):
            return agent_instance.run(task)
        if hasattr(agent_instance, 'execute'):
            return agent_instance.execute(task)
        raise ValueError("Legacy agent must have 'run' or 'execute' method")


def deprecated(
    message: str = "This function is deprecated. Please use the new plugin API.",
    removal_version: str = "5.0.0"
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator to mark functions as deprecated."""
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            warnings.warn(
                f"{message} Will be removed in {removal_version}.",
                DeprecationWarning,
                stacklevel=2
            )
            return func(*args, **kwargs)
        return wrapper
    return decorator


class DeprecatedConfig:
    """Compatibility wrapper for legacy configuration formats."""
    
    def __init__(self, config: dict):
        self._config = config
        self._migrate()
    
    def _migrate(self) -> None:
        """Migrate legacy config keys to new format."""
        mappings = {
            'agent_type': 'type',
            'model_name': 'model',
            'api_key': 'apiKey',
            'endpoint_url': 'endpoint',
            'max_retries': 'maxRetries',
            'timeout_sec': 'timeout',
            'enable_cache': 'cache',
        }
        for old_key, new_key in mappings.items():
            if old_key in self._config and new_key not in self._config:
                self._config[new_key] = self._config.pop(old_key)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        return self._config.get(key, default)
    
    def to_dict(self) -> dict:
        """Return configuration as dictionary."""
        return self._config.copy()


class PluginCompat:
    """Main compatibility class for plugin system."""
    
    @staticmethod
    @deprecated("register_agent is deprecated")
    def register_agent(name: str, agent_class: type) -> None:
        """Register a legacy agent. Deprecated in favor of new plugin registry."""
        from .registry import PluginRegistry
        registry = PluginRegistry.get_instance()
        registry.register(name, agent_class)
    
    @staticmethod
    @deprecated("load_agent is deprecated")
    def load_agent(name: str, config: Optional[dict] = None) -> Any:
        """Load a legacy agent. Deprecated in favor of new plugin loader."""
        from .loader import PluginLoader
        loader = PluginLoader()
        return loader.load(name, config or {})
    
    @staticmethod
    @deprecated("validate_plugin is deprecated")
    def validate_plugin(plugin: Any) -> bool:
        """Validate a plugin. Deprecated in favor of new validation system."""
        from .validation import PluginValidator
        validator = PluginValidator()
        return validator.validate(plugin)
    
    @staticmethod
    def adapt_legacy_agent(legacy_agent: Any, config: Optional[dict] = None) -> Any:
        """Adapt a legacy agent to work with the new plugin system."""
        warnings.warn(
            "Using legacy agent adapter. Consider migrating to the new plugin API.",
            DeprecationWarning,
            stacklevel=2
        )
        
        class AdaptedPlugin:
            def __init__(self, agent: Any, cfg: dict):
                self._agent = agent
                self._config = cfg or {}
            
            def execute(self, task: str) -> Any:
                if hasattr(self._agent, 'run'):
                    return self._agent.run(task)
                elif hasattr(self._agent, 'execute'):
                    return self._agent.execute(task)
                elif hasattr(self._agent, '__call__'):
                    return self._agent(task)
                raise ValueError("Legacy agent has no executable method")
            
            def get_metadata(self) -> dict:
                if hasattr(self._agent, 'metadata'):
                    return self._agent.metadata
                return {'name': type(self._agent).__name__, 'version': 'legacy'}
        
        return AdaptedPlugin(legacy_agent, config or {})
    
    @staticmethod
    def convert_legacy_config(config: dict) -> dict:
        """Convert legacy configuration format to new format."""
        return DeprecatedConfig(config).to_dict()


def create_legacy_agent_proxy(
    agent_class: type,
    config: Optional[dict] = None
) -> Any:
    """
    Create a proxy for legacy agent to provide backwards compatibility.
    
    Args:
        agent_class: The legacy agent class to wrap
        config: Agent configuration
        
    Returns:
        Adapted plugin instance
    """
    return LegacyAgentAdapter(agent_class).create(config)


__all__ = [
    'LegacyAgentAdapter',
    'DeprecatedConfig',
    'PluginCompat',
    'deprecated',
    'create_legacy_agent_proxy',
]
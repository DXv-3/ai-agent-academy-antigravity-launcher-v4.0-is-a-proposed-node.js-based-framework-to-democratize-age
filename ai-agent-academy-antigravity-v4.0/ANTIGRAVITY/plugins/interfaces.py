"""
ANTIGRAVITY Plugin System Interfaces
Core interface definitions for the Antigravity skill plugin system.

This module defines the official plugin interface contract that all plugins must implement.
It includes metadata interfaces, capability declarations, and lifecycle hook definitions.
"""

from abc import ABC, abstractmethod
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum


class PluginState(Enum):
    """Enumeration of possible plugin states during lifecycle."""
    UNINITIALIZED = "uninitialized"
    INITIALIZING = "initializing"
    INITIALIZED = "initialized"
    ACTIVATING = "activating"
    ACTIVE = "active"
    DEACTIVATING = "deactivating"
    DEACTIVATED = "deactivated"
    DESTROYING = "destroying"
    DESTROYED = "destroyed"
    ERROR = "error"


class Capability(Enum):
    """Enumeration of capabilities that plugins can declare and request."""
    TERMINAL = "terminal"      # Execute shell commands
    BROWSER = "browser"        # Navigate web pages and interact
    FILES = "files"           # Read/write files in workspace
    NETWORK = "network"       # Make HTTP requests
    DOCKER = "docker"         # Manage containers
    DEPLOY = "deploy"         # Deploy to Antigravity workspaces


@dataclass
class PluginMetadata:
    """Metadata interface for plugin identification and configuration.

    This defines the basic information required for plugin registration
    and dependency resolution.
    """
    id: str                          # Unique plugin identifier
    name: str                       # Human-readable display name
    version: str                    # Semantic version string
    author: str                     # Plugin author/organization
    description: str                # Brief description of plugin purpose
    dependencies: List[str]         # List of required plugin IDs
    antigravity_version: str        # Required Antigravity version constraint

    def __post_init__(self):
        """Validate metadata after initialization."""
        if not self.id or not isinstance(self.id, str):
            raise ValueError("Plugin ID must be a non-empty string")
        if not self.version or not isinstance(self.version, str):
            raise ValueError("Plugin version must be a non-empty string")
        if not self.antigravity_version or not isinstance(self.antigravity_version, str):
            raise ValueError("Antigravity version constraint must be a non-empty string")


@dataclass
class ToolDefinition:
    """Definition of a tool that the plugin exposes.

    Tools are the individual capabilities that plugins provide to Antigravity IDE.
    """
    name: str                       # Tool name (unique within plugin)
    description: str                # Human-readable description
    input_schema: Dict[str, Any]    # JSON Schema for tool input validation
    output_schema: Optional[Dict[str, Any]] = None  # Optional output schema

    def __post_init__(self):
        """Validate tool definition after initialization."""
        if not self.name or not isinstance(self.name, str):
            raise ValueError("Tool name must be a non-empty string")
        if not self.description or not isinstance(self.description, str):
            raise ValueError("Tool description must be a non-empty string")
        if not isinstance(self.input_schema, dict):
            raise ValueError("Tool input schema must be a dictionary")


@dataclass
class PluginManifest:
    """Complete plugin manifest combining metadata and capabilities.

    This is the complete declaration of what a plugin provides and requires.
    """
    metadata: PluginMetadata
    capabilities: List[Capability]
    tools: List[ToolDefinition]

    def __post_init__(self):
        """Validate manifest after initialization."""
        if not isinstance(self.capabilities, list):
            raise ValueError("Capabilities must be a list")
        if not isinstance(self.tools, list):
            raise ValueError("Tools must be a list")

        # Validate tool names are unique
        tool_names = [tool.name for tool in self.tools]
        if len(tool_names) != len(set(tool_names)):
            raise ValueError("Tool names must be unique within the plugin")


class PluginContext:
    """Context object passed to plugin lifecycle methods.

    Provides access to Antigravity services and configuration.
    """
    def __init__(self,
                 workspace_path: str,
                 antigravity_version: str,
                 config: Optional[Dict[str, Any]] = None):
        self.workspace_path = workspace_path
        self.antigravity_version = antigravity_version
        self.config = config or {}

    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key."""
        return self.config.get(key, default)

    def set_config(self, key: str, value: Any) -> None:
        """Set configuration value."""
        self.config[key] = value


class PluginError(Exception):
    """Base exception for plugin-related errors."""
    def __init__(self, message: str, plugin_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.plugin_id = plugin_id
        self.details = details or {}


class PluginInitializationError(PluginError):
    """Raised when plugin initialization fails."""
    pass


class PluginActivationError(PluginError):
    """Raised when plugin activation fails."""
    pass


class PluginLifecycleError(PluginError):
    """Raised when plugin lifecycle operations fail."""
    pass


class PluginInterface(ABC):
    """Protocol defining the complete plugin interface contract.

    All plugins must implement this interface to be compatible with
    the Antigravity plugin system.
    """

    @property
    @abstractmethod
    def manifest(self) -> PluginManifest:
        """Return the plugin's manifest with metadata and capabilities."""
        raise NotImplementedError

    @property
    @abstractmethod
    def state(self) -> PluginState:
        """Return the current plugin state."""
        raise NotImplementedError

    @abstractmethod
    async def initialize(self, context: PluginContext) -> None:
        """Initialize the plugin with the provided context.

        This is called once when the plugin is first loaded. Use this to:
        - Validate dependencies
        - Load configuration
        - Initialize internal state
        - Register event handlers

        Args:
            context: Plugin context with workspace and configuration access

        Raises:
            PluginInitializationError: If initialization fails
        """
        raise NotImplementedError

    @abstractmethod
    async def activate(self) -> None:
        """Activate the plugin for use.

        This is called when the plugin should become operational. Use this to:
        - Start background processes
        - Register tools with Antigravity
        - Establish connections

        Raises:
            PluginActivationError: If activation fails
        """
        raise NotImplementedError

    @abstractmethod
    async def deactivate(self) -> None:
        """Deactivate the plugin.

        This is called when the plugin should stop operations. Use this to:
        - Stop background processes
        - Unregister tools
        - Clean up resources (but keep state for reactivation)

        Raises:
            PluginLifecycleError: If deactivation fails
        """
        raise NotImplementedError

    @abstractmethod
    async def destroy(self) -> None:
        """Destroy the plugin and clean up all resources.

        This is called when the plugin is being unloaded permanently. Use this to:
        - Release all resources
        - Save final state if needed
        - Clean up completely

        Raises:
            PluginLifecycleError: If destruction fails
        """
        raise NotImplementedError

    @abstractmethod
    async def execute_tool(self, tool_name: str, input_data: Dict[str, Any]) -> Any:
        """Execute a tool with the given input data.

        Args:
            tool_name: Name of the tool to execute
            input_data: Input data matching the tool's input schema

        Returns:
            Tool execution result

        Raises:
            ValueError: If tool_name is not recognized
            PluginError: If tool execution fails
        """
        raise NotImplementedError


class CapabilityValidator(ABC):
    """Protocol for validating plugin capability requests."""

    @abstractmethod
    def validate_capabilities(self, capabilities: List[Capability], context: PluginContext) -> Dict[Capability, bool]:
        """Validate whether requested capabilities are allowed.

        Args:
            capabilities: List of capabilities to validate
            context: Plugin execution context

        Returns:
            Dictionary mapping capabilities to approval status
        """
        raise NotImplementedError  # pragma: no cover
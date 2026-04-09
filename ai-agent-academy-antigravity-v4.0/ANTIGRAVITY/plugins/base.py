"""
ANTIGRAVITY Plugin System Base Classes
Abstract base class implementation for Antigravity skill plugins.

This module provides the base Plugin class that implements the core lifecycle
management, error handling, and state tracking for plugins.
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Callable
from contextlib import asynccontextmanager

from .interfaces import (
    PluginInterface,
    PluginManifest,
    PluginContext,
    PluginState,
    PluginError,
    PluginInitializationError,
    PluginActivationError,
    PluginLifecycleError,
)


logger = logging.getLogger(__name__)


class BasePlugin(ABC):
    """Abstract base class for Antigravity skill plugins.

    This class provides the core plugin infrastructure including:
    - Lifecycle state management
    - Error handling and recovery
    - Configuration management
    - Tool registration and execution
    - Async context management

    Subclasses must implement the abstract methods and define their manifest.
    """

    def __init__(self):
        """Initialize the plugin with default state."""
        self._state = PluginState.UNINITIALIZED
        self._context: Optional[PluginContext] = None
        self._tools: Dict[str, Callable] = {}
        self._config: Dict[str, Any] = {}
        self._initialized = False
        self._activated = False

    @property
    def manifest(self) -> PluginManifest:
        """Return the plugin's manifest with metadata and capabilities.

        Subclasses must override this property to return their specific manifest.

        Returns:
            PluginManifest: The plugin's complete manifest
        """
        raise NotImplementedError("Subclasses must implement the manifest property")

    @property
    def state(self) -> PluginState:
        """Return the current plugin state.

        Returns:
            PluginState: Current lifecycle state of the plugin
        """
        return self._state

    @property
    def context(self) -> Optional[PluginContext]:
        """Return the plugin's execution context.

        Returns:
            Optional[PluginContext]: The context provided during initialization
        """
        return self._context

    @property
    def is_initialized(self) -> bool:
        """Check if the plugin has been initialized.

        Returns:
            bool: True if the plugin is initialized
        """
        return self._initialized

    @property
    def is_active(self) -> bool:
        """Check if the plugin is currently active.

        Returns:
            bool: True if the plugin is active
        """
        return self._activated

    def _set_state(self, new_state: PluginState) -> None:
        """Set the plugin state with logging.

        Args:
            new_state: The new state to transition to
        """
        old_state = self._state
        self._state = new_state
        logger.info(f"Plugin {self.manifest.metadata.id} state: {old_state.value} -> {new_state.value}")

    async def initialize(self, context: PluginContext) -> None:
        """Initialize the plugin with the provided context.

        This method handles the initialization lifecycle including:
        - State validation
        - Context storage
        - Dependency validation
        - Configuration loading
        - Custom initialization logic

        Args:
            context: Plugin context with workspace and configuration access

        Raises:
            PluginInitializationError: If initialization fails
        """
        try:
            if self._state != PluginState.UNINITIALIZED:
                raise PluginInitializationError(
                    f"Cannot initialize plugin in state {self._state.value}",
                    plugin_id=self.manifest.metadata.id
                )

            self._set_state(PluginState.INITIALIZING)
            self._context = context

            # Validate dependencies
            await self._validate_dependencies()

            # Load configuration
            await self._load_configuration()

            # Register tools
            self._register_tools()

            # Call subclass initialization
            await self._on_initialize()

            self._initialized = True
            self._set_state(PluginState.INITIALIZED)

            logger.info(f"Plugin {self.manifest.metadata.id} initialized successfully")

        except Exception as e:
            self._set_state(PluginState.ERROR)
            if isinstance(e, PluginError):
                raise
            raise PluginInitializationError(
                f"Failed to initialize plugin: {str(e)}",
                plugin_id=self.manifest.metadata.id,
                details={"original_error": str(e)}
            ) from e

    async def activate(self) -> None:
        """Activate the plugin for use.

        This method handles the activation lifecycle including:
        - State validation
        - Resource allocation
        - Service connections
        - Custom activation logic

        Raises:
            PluginActivationError: If activation fails
        """
        try:
            if not self._initialized:
                raise PluginActivationError(
                    "Cannot activate uninitialized plugin",
                    plugin_id=self.manifest.metadata.id
                )

            if self._state not in (PluginState.INITIALIZED, PluginState.DEACTIVATED):
                raise PluginActivationError(
                    f"Cannot activate plugin in state {self._state.value}",
                    plugin_id=self.manifest.metadata.id
                )

            self._set_state(PluginState.ACTIVATING)

            # Call subclass activation
            await self._on_activate()

            self._activated = True
            self._set_state(PluginState.ACTIVE)

            logger.info(f"Plugin {self.manifest.metadata.id} activated successfully")

        except Exception as e:
            self._set_state(PluginState.ERROR)
            if isinstance(e, PluginError):
                raise
            raise PluginActivationError(
                f"Failed to activate plugin: {str(e)}",
                plugin_id=self.manifest.metadata.id,
                details={"original_error": str(e)}
            ) from e

    async def deactivate(self) -> None:
        """Deactivate the plugin.

        This method handles the deactivation lifecycle including:
        - State validation
        - Resource cleanup (keeping state)
        - Service disconnection
        - Custom deactivation logic

        Raises:
            PluginLifecycleError: If deactivation fails
        """
        try:
            if self._state != PluginState.ACTIVE:
                logger.warning(f"Attempting to deactivate plugin in state {self._state.value}")
                return

            self._set_state(PluginState.DEACTIVATING)

            # Call subclass deactivation
            await self._on_deactivate()

            self._activated = False
            self._set_state(PluginState.DEACTIVATED)

            logger.info(f"Plugin {self.manifest.metadata.id} deactivated successfully")

        except Exception as e:
            self._set_state(PluginState.ERROR)
            if isinstance(e, PluginError):
                raise
            raise PluginLifecycleError(
                f"Failed to deactivate plugin: {str(e)}",
                plugin_id=self.manifest.metadata.id,
                details={"original_error": str(e)}
            ) from e

    async def destroy(self) -> None:
        """Destroy the plugin and clean up all resources.

        This method handles the destruction lifecycle including:
        - State validation
        - Complete resource cleanup
        - State reset
        - Custom destruction logic

        Raises:
            PluginLifecycleError: If destruction fails
        """
        try:
            if self._state == PluginState.DESTROYED:
                logger.warning(f"Attempting to destroy already destroyed plugin")
                return

            self._set_state(PluginState.DESTROYING)

            # Call subclass destruction
            await self._on_destroy()

            # Clean up resources
            self._tools.clear()
            self._config.clear()
            self._context = None
            self._initialized = False
            self._activated = False

            self._set_state(PluginState.DESTROYED)

            logger.info(f"Plugin {self.manifest.metadata.id} destroyed successfully")

        except Exception as e:
            self._set_state(PluginState.ERROR)
            if isinstance(e, PluginError):
                raise
            raise PluginLifecycleError(
                f"Failed to destroy plugin: {str(e)}",
                plugin_id=self.manifest.metadata.id,
                details={"original_error": str(e)}
            ) from e

    async def execute_tool(self, tool_name: str, input_data: Dict[str, Any]) -> Any:
        """Execute a tool with the given input data.

        This method validates the tool exists, checks input schema compliance,
        and executes the tool within the plugin's context.

        Args:
            tool_name: Name of the tool to execute
            input_data: Input data matching the tool's input schema

        Returns:
            Tool execution result

        Raises:
            ValueError: If tool_name is not recognized
            PluginError: If tool execution fails
        """
        if not self._activated:
            raise PluginError(
                "Cannot execute tools on inactive plugin",
                plugin_id=self.manifest.metadata.id
            )

        if tool_name not in self._tools:
            raise ValueError(f"Unknown tool: {tool_name}")

        try:
            # Validate input against schema (basic validation)
            tool_def = next(t for t in self.manifest.tools if t.name == tool_name)
            await self._validate_tool_input(tool_def, input_data)

            # Execute the tool
            result = await self._tools[tool_name](input_data)

            logger.debug(f"Tool {tool_name} executed successfully")
            return result

        except Exception as e:
            logger.error(f"Tool {tool_name} execution failed: {str(e)}")
            if isinstance(e, PluginError):
                raise
            raise PluginError(
                f"Tool execution failed: {str(e)}",
                plugin_id=self.manifest.metadata.id,
                details={"tool": tool_name, "original_error": str(e)}
            ) from e

    @asynccontextmanager
    async def lifecycle_context(self):
        """Async context manager for plugin lifecycle.

        This ensures proper cleanup even if errors occur during plugin usage.

        Usage:
            async with plugin.lifecycle_context():
                await plugin.initialize(context)
                await plugin.activate()
                # Use plugin...
        """
        try:
            yield self
        finally:
            try:
                if self._activated:
                    await self.deactivate()
                if self._initialized:
                    await self.destroy()
            except Exception as e:
                logger.error(f"Error during plugin cleanup: {str(e)}")

    # --- Abstract methods for subclasses to implement ---

    @abstractmethod
    async def _on_initialize(self) -> None:
        """Custom initialization logic for subclasses.

        This is called during the initialization phase after basic setup.
        Subclasses should implement their specific initialization here.
        """
        pass

    @abstractmethod
    async def _on_activate(self) -> None:
        """Custom activation logic for subclasses.

        This is called during the activation phase.
        Subclasses should start services and connections here.
        """
        pass

    @abstractmethod
    async def _on_deactivate(self) -> None:
        """Custom deactivation logic for subclasses.

        This is called during the deactivation phase.
        Subclasses should stop services but preserve state here.
        """
        pass

    @abstractmethod
    async def _on_destroy(self) -> None:
        """Custom destruction logic for subclasses.

        This is called during the destruction phase.
        Subclasses should perform complete cleanup here.
        """
        pass

    # --- Protected helper methods ---

    async def _validate_dependencies(self) -> None:
        """Validate that all required dependencies are available.

        This is a basic implementation that can be overridden by subclasses
        for more sophisticated dependency checking.
        """
        # Basic dependency validation - check if dependency IDs are non-empty
        for dep in self.manifest.metadata.dependencies:
            if not dep or not isinstance(dep, str):
                raise PluginInitializationError(
                    f"Invalid dependency: {dep}",
                    plugin_id=self.manifest.metadata.id
                )

    async def _load_configuration(self) -> None:
        """Load plugin configuration from context.

        This merges context configuration with any default configuration.
        Subclasses can override this for custom configuration loading.
        """
        if self._context:
            self._config.update(self._context.config)

    def _register_tools(self) -> None:
        """Register tool implementations.

        Subclasses should override this to register their specific tools.
        The base implementation registers no tools.
        """
        pass

    async def _validate_tool_input(self, tool_def, input_data: Dict[str, Any]) -> None:
        """Validate tool input against the tool's schema.

        This is a basic validation that can be extended by subclasses.

        Args:
            tool_def: Tool definition from manifest
            input_data: Input data to validate
        """
        schema = tool_def.input_schema
        if schema.get("type") == "object":
            required = schema.get("required", [])
            for field in required:
                if field not in input_data:
                    raise ValueError(f"Missing required field: {field}")


class PluginRegistry:
    """Registry for managing plugin instances.

    This class provides utilities for plugin discovery, registration,
    and lifecycle management across multiple plugins.
    """

    def __init__(self):
        self._plugins: Dict[str, BasePlugin] = {}
        self._active_plugins: set[str] = set()

    def register(self, plugin: BasePlugin) -> None:
        """Register a plugin instance.

        Args:
            plugin: The plugin instance to register

        Raises:
            ValueError: If a plugin with the same ID is already registered
        """
        plugin_id = plugin.manifest.metadata.id
        if plugin_id in self._plugins:
            raise ValueError(f"Plugin {plugin_id} is already registered")

        self._plugins[plugin_id] = plugin
        logger.info(f"Registered plugin: {plugin_id}")

    def unregister(self, plugin_id: str) -> None:
        """Unregister a plugin.

        Args:
            plugin_id: ID of the plugin to unregister

        Raises:
            ValueError: If plugin is not registered or still active
        """
        if plugin_id not in self._plugins:
            raise ValueError(f"Plugin {plugin_id} is not registered")

        if plugin_id in self._active_plugins:
            raise ValueError(f"Cannot unregister active plugin: {plugin_id}")

        del self._plugins[plugin_id]
        logger.info(f"Unregistered plugin: {plugin_id}")

    def get_plugin(self, plugin_id: str) -> Optional[BasePlugin]:
        """Get a registered plugin by ID.

        Args:
            plugin_id: ID of the plugin to retrieve

        Returns:
            Optional[BasePlugin]: The plugin instance, or None if not found
        """
        return self._plugins.get(plugin_id)

    def list_plugins(self) -> List[BasePlugin]:
        """List all registered plugins.

        Returns:
            List[BasePlugin]: All registered plugin instances
        """
        return list(self._plugins.values())

    async def initialize_all(self, context_factory: Callable[[str], PluginContext]) -> None:
        """Initialize all registered plugins.

        Args:
            context_factory: Function to create context for each plugin

        Raises:
            PluginError: If any plugin fails to initialize
        """
        for plugin in self._plugins.values():
            plugin_context = context_factory(plugin.manifest.metadata.id)
            await plugin.initialize(plugin_context)

    async def activate_all(self) -> None:
        """Activate all initialized plugins.

        Raises:
            PluginError: If any plugin fails to activate
        """
        for plugin in self._plugins.values():
            if plugin.is_initialized:
                await plugin.activate()
                self._active_plugins.add(plugin.manifest.metadata.id)

    async def deactivate_all(self) -> None:
        """Deactivate all active plugins.

        This attempts to deactivate all plugins, collecting any errors.
        """
        errors = []
        for plugin_id in list(self._active_plugins):
            try:
                plugin = self._plugins[plugin_id]
                await plugin.deactivate()
                self._active_plugins.remove(plugin_id)
            except Exception as e:
                errors.append((plugin_id, e))
                logger.error(f"Failed to deactivate plugin {plugin_id}: {str(e)}")

        if errors:
            # Re-raise the first error
            plugin_id, error = errors[0]
            raise PluginLifecycleError(
                f"Failed to deactivate {len(errors)} plugins, first error from {plugin_id}: {str(error)}"
            ) from error

    async def destroy_all(self) -> None:
        """Destroy all plugins.

        This attempts to destroy all plugins, collecting any errors.
        """
        errors = []
        for plugin_id, plugin in list(self._plugins.items()):
            try:
                await plugin.destroy()
            except Exception as e:
                errors.append((plugin_id, e))
                logger.error(f"Failed to destroy plugin {plugin_id}: {str(e)}")

        self._plugins.clear()
        self._active_plugins.clear()

        if errors:
            # Re-raise the first error
            plugin_id, error = errors[0]
            raise PluginLifecycleError(
                f"Failed to destroy {len(errors)} plugins, first error from {plugin_id}: {str(error)}"
            ) from error
@placement indexer

[indexing]
    * Indexing Section.
	
enable = <string>
    * Specifies if you want events indexed.

index = <string>
    * Specifies what index to put events in.
	
[logging]
    * Logging Section.

rootLevel = [DEBUG|INFO|WARNING|ERROR]
    * Specifies the root level of logging.
	
logger.freezer_inventory_endpoint-freezers = [DEBUG|INFO|WARNING|ERROR]
    * Specifies the level of logging specific to the freezers REST endpoint.

logger.freezer_inventory_endpoint-items = [DEBUG|INFO|WARNING|ERROR]
    * Specifies the level of logging specific to the items REST endpoint.

logger.freezer_inventory_endpoint-settings = [DEBUG|INFO|WARNING|ERROR]
    * Specifies the level of logging specific to the settings REST endpoint.

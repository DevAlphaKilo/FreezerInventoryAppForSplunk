# FreezerInventoryAppForSplunk
This app was created to track the inventory of one or more freezer(s) and display them across a set of pre-built dashboards.

#### App Repository
https://github.com/DevAlphaKilo/FreezerInventoryAppForSplunk

#### Splunk Admin Considerations
 - **The KV Store must be enabled for this app to work, core functionality relies on the KV store**
 - By Default, item events are not indexed unless explicitly enabled (enable=true)
 - By Default, the app is not deployed with an indexes.conf file and will not create any indexes
 - Item event indexing must be enabled to use some reports.
   - Item(s) Removed - Last 7 Days
   
## How It Works
 - Both **Items** and **Freezers** are stored in indivual KV Stores.
 - **Items** have a relational field for which **Freezer** the item is stored with-in
 - New **Items** are added to the 'items' KV Store
 - New **Freezer** are added to the 'freezer' KV Store
 - Dashboards display KV Store info

## Initial Setup
#### App Setup
- Configure Item Event Indexing, if desired
  - If required, create new index for events to be indexed
- *If indexing is not enabled, the app will still function but will be unable to track when items have been removed*
```
enable = <string> (true|false)
    * Specifies if you want events indexed.

index = <string> 
    * Specifies what index to put events in.
```

#### First Steps
 - Create one or more freezers
   - **Set at least one as 'default'** (*the app assumes new items are placed in the default freezer*)
 - Add items as desired
 - Items will now be displayed on dashboards


# FreezerInventoryAppForSplunk
This app was created to track the inventory of one or more freezer(s) and display them across a set of pre-built dashboards.

#### App Repository
https://github.com/DevAlphaKilo/FreezerInventoryAppForSplunk

## How It Works
#### App Setup
- Configure Item Event Indexing
```
enable = <string> (true|false)
    * Specifies if you want events indexed.

index = <string> 
    * Specifies what index to put events in.
```

#### First Steps
 - Create one or more freezers
   - **Set at least one as 'default'**
 - Add items as desired
 - Items will now be displayed on dashboards
 
 #### Considerations
 - By Default, item events are not indexed unless explicitly enabled (enable=true)
 - Item event indexing must be enabled to use some reports.
   - Item(s) Removed - Last 7 Days

import splunk.admin as admin
import splunk.entity as en
import splunk.appserver.mrsparkle.lib.util as util
# import your required python modules
import os
import sys

dir = os.path.join(util.get_apps_dir(), 'FreezerInventoryAppForSplunk', 'bin', 'lib')
if not dir in sys.path:
    sys.path.append(dir)
    
from FreezerInventoryLogger import *

logger = setupLogger('endpoint-settings')

class ConfigApp(admin.MConfigHandler):
  '''
  Set up supported arguments
  '''
  def setup(self):
    if self.requestedAction == admin.ACTION_EDIT:
      for arg in ['enable','index']:
        self.supportedArgs.addOptArg(arg)
        

  '''
  Read the initial values of the parameters from the custom file
      myappsetup.conf, and write them to the setup page. 

  If the app has never been set up,
      uses .../app_name/default/myappsetup.conf. 

  If app has been set up, looks at 
      .../local/myappsetup.conf first, then looks at 
  .../default/myappsetup.conf only if there is no value for a field in
      .../local/myappsetup.conf

  For boolean fields, may need to switch the true/false setting.

  For text fields, if the conf file says None, set to the empty string.
  '''

  def handleList(self, confInfo):
    logger.debug('starting handleList')
    logger.debug('confInfo: %s', confInfo)
    confDict = self.readConf("freezer_inventory")
    logger.debug('confDict: %s', confDict)   
    if None != confDict:
      for stanza, settings in confDict.items():
        for key, val in settings.items():
          if key in ['enable']:
            if val.lower() in ["true", "1"]:
              val = "true"
            else:
              val = "false"
          if key in ['index'] and val in [None, '']:
            val = ''
          confInfo[stanza].append(key, val)
          
  '''
  After user clicks Save on setup page, take updated parameters,
  normalize them, and save them somewhere
  '''
  def handleEdit(self, confInfo):
    logger.debug('starting handleEdit')
    logger.debug('confInfo: %s', confInfo)
    name = self.callerArgs.id
    args = self.callerArgs
    
    logger.debug('name: %s', name)
    logger.debug('args: %s', args)  
    
    self.writeConf('freezer_inventory', 'indexing', self.callerArgs.data)
      
# initialize the handler
admin.init(ConfigApp, admin.CONTEXT_NONE)

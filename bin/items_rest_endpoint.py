import os
import sys
import json
import urllib
import operator
import httplib

import splunk
import splunk.appserver.mrsparkle.lib.util as util
import splunk.entity as entity
import splunk.rest as rest

dir = os.path.join(util.get_apps_dir(), 'FreezerInventoryAppForSplunk', 'bin', 'lib')
if not dir in sys.path:
    sys.path.append(dir)
	
from FreezerInventoryLogger import *
   
logger = setupLogger('freezer_inventory')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)

from splunk.persistconn.application import PersistentServerConnectionApplication

class ItemsEndpoint(PersistentServerConnectionApplication):
    def __init__(self, command_line, command_arg):
        PersistentServerConnectionApplication.__init__(self)

    def handle(self, args):
        logger.debug("START endpoint()")
        logger.debug('ARGS: %s', args)

        args = json.loads(args)

        try:
            logger.info('Handling %s request.' % args['method'])
            method = 'handle_' + args['method'].lower()
            if callable(getattr(self, method, None)):
                return operator.methodcaller(method, args)(self)
            else:
                return self.response('Invalid method for this endpoint', httplib.METHOD_NOT_ALLOWED)
        except ValueError as e:
            msg = 'ValueError: %s' % e.message
            return self.response(msg, httplib.BAD_REQUEST)
        except splunk.RESTException as e:
            return self.response('RESTexception: %s' % e, httplib.INTERNAL_SERVER_ERROR)
        except Exception as e:
            msg = 'Unknown exception: %s' % e
            logger.exception(msg)
            return self.response(msg, httplib.INTERNAL_SERVER_ERROR)

    def handle_get(self, args):
        logger.debug('GET ARGS %s', json.dumps(args))

        query_params = dict(args.get('query', []))

        try:
            sessionKey = args["session"]["authtoken"]
            user = args["session"]["user"]
        except KeyError:
            return self.response("Failed to obtain auth token", httplib.UNAUTHORIZED)

        required = ['action']
        missing = [r for r in required if r not in query_params]
        if missing:
            return self.response("Missing required arguments: %s" % missing, httplib.BAD_REQUEST)

        action = '_' + query_params.pop('action').lower()
        if callable(getattr(self, action, None)):
            return operator.methodcaller(action, sessionKey, query_params)(self)
        else:
            msg = 'Invalid action: action="{}"'.format(action)
            logger.exception(msg)
            return self.response(msg, httplib.BAD_REQUEST)

    def handle_post(self, args):
        #logger.debug('POST ARGS %s', json.dumps(args))

        post_data = dict(args.get('form', []))

        try:
            sessionKey = args["session"]["authtoken"]
            user = args["session"]["user"]
        except KeyError:
            return self.response("Failed to obtain auth token", httplib.UNAUTHORIZED)


        required = ['action']
        missing = [r for r in required if r not in post_data]
        if missing:
            return self.response("Missing required arguments: %s" % missing, httplib.BAD_REQUEST)

        action = '_' + post_data.pop('action').lower()
        if callable(getattr(self, action, None)):
            return operator.methodcaller(action, sessionKey, user, post_data)(self)
        else:
            msg = 'Invalid action: action="{}"'.format(action)
            #logger.exception(msg)
            return self.response(msg, httplib.BAD_REQUEST)

    @staticmethod
    def response(msg, status):
        if status < 400:
            payload = msg
        else:
            # replicate controller's jsonresponse format
            payload = {
                "success": False,
                "messages": [{'type': 'ERROR', 'message': msg}],
                "responses": [],
            }
        return {'status': status, 'payload': payload}

    def _get_items(self, sessionKey, query_params):
        logger.debug("START _list_item_details()")

        splunk.setDefault('sessionKey', sessionKey)
        
        items_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/items?output_mode=json'
        
        # Get item json
        serverResponse, serverContent = rest.simpleRequest(items_uri, sessionKey=sessionKey, method='GET')
        logger.debug("items: %s" % serverContent)
        items = json.loads(serverContent)

        return self.response(items, httplib.OK)
        
    def _post_item(self, sessionKey, user, post_data):
        logger.debug("START _post_item()")
        required = ['item_data']
        missing = [r for r in required if r not in post_data]
        if missing:
            return self.response("Missing required arguments: %s" % missing, httplib.BAD_REQUEST)

        item_data = post_data.pop('item_data')

        splunk.setDefault('sessionKey', sessionKey)

        #eh = EventHandler(sessionKey = sessionKey)
        
        #config = {}
        #config['index'] = 'test'
        #
        #restconfig = entity.getEntities('configs/freezer_inventory', count=-1, sessionKey=sessionKey)
        #if len(restconfig) > 0:
        #    if 'index' in restconfig['settings']:
        #        config['index'] = restconfig['settings']['index']
        #
        #logger.debug("Global settings: %s" % config)
        
        # Parse the JSON
        item_data = json.loads(item_data)
        
        items_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/items'
        
        # Get incident json
        serverResponse, serverContent = rest.simpleRequest(item_uri, sessionKey=sessionKey, jsonargs=item_data, method='POST')
        logger.debug("items: %s" % serverContent)
        items = json.loads(serverContent)

        return self.response(items, httplib.OK)


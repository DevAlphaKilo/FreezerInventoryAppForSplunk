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
   
logger = setupLogger('endpoint-freezers')

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)

from splunk.persistconn.application import PersistentServerConnectionApplication

class FreezersEndpoint(PersistentServerConnectionApplication):
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
        logger.debug('POST ARGS %s', json.dumps(args))

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
            logger.exception(msg)
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

    def _get_freezers(self, sessionKey, query_params):
        logger.debug("START _get_freezers()")
        splunk.setDefault('sessionKey', sessionKey)

        freezers_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers?output_mode=json'

        # Get item json
        serverResponse, serverContent = rest.simpleRequest(freezers_uri, sessionKey=sessionKey, method='GET')
        logger.debug("freezers: %s" % serverContent)
        freezers = json.loads(serverContent)
        return self.response(freezers, httplib.OK)
        
    #def _get_freezer_items(self, sessionKey, query_params):
    #    logger.debug("START _get_item_info()")
    #    required = ['_key','id']
    #    missing = [r for r in required if r not in query_params]
    #    if len(missing) > 1:
    #        return self.response("Missing a required argument: %s" % missing, httplib.BAD_REQUEST)
    #
    #    splunk.setDefault('sessionKey', sessionKey)
    #
    #    if '_key' in query_params:
    #        item_id = query_params.pop('_key')
    #    else:
    #        item_id = query_params.pop('id')
    #        all_items = self._get_items(sessionKey, query_params)
    #        logger.debug("all_items: %s" % all_items)
    #        for item in all_items['payload']:
    #            if item['id'] == item_id:
    #                item_id = item['_key']
    #
    #    items_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers/%s' % item_id
    #
    #    # Get item json
    #    serverResponse, serverContent = rest.simpleRequest(items_uri, sessionKey=sessionKey, method='GET')
    #    logger.debug("item_info: %s" % serverContent)
    #    item_info = json.loads(serverContent)
    #
    #    return self.response(item_info, httplib.OK)

    def _add_freezer(self, sessionKey, user, post_data):
        logger.debug("START _add_freezer()")
        logger.debug('post_data: %s', post_data)
        required = ['item_data']
        missing = [r for r in required if r not in post_data]
        if missing:
            return self.response("Missing required arguments: %s" % missing, httplib.BAD_REQUEST)

        item_data = post_data.pop('item_data')

        splunk.setDefault('sessionKey', sessionKey)

        # Parse the JSON
        #item_data = json.loads(item_data)
        #logger.debug('item_data: %s', item_data)

        items_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers'

        # Get incident json
        serverResponse, serverContent = rest.simpleRequest(items_uri, sessionKey=sessionKey, jsonargs=item_data, method='POST')
        logger.debug("items: %s" % serverContent)
        items = json.loads(serverContent)
        return self.response(items, httplib.OK)

    def _delete_freezer(self, sessionKey, query_params):
        logger.debug("START _delete_freezer()")
        required = ['_key','id']
        missing = [r for r in required if r not in query_params]
        if len(missing) > 1:
            return self.response("Missing a required argument: %s" % missing, httplib.BAD_REQUEST)

        splunk.setDefault('sessionKey', sessionKey)

        if '_key' in query_params:
            item_id = query_params.pop('_key')
        else:
            item_id = query_params.pop('id')
            all_items = self._get_items(sessionKey, query_params)
            logger.debug("all_items: %s" % all_items)
            for item in all_items['payload']:
                if item['id'] == item_id:
                    item_id = item['_key']

        items_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers/%s' % item_id

        # Get item json
        serverResponse, serverContent = rest.simpleRequest(items_uri, sessionKey=sessionKey, method='DELETE')
        logger.debug("items: %s" % serverContent)
        items = json.loads(serverContent)
        return self.response(items, httplib.OK)
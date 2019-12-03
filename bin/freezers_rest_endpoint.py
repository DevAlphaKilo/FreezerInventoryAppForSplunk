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

    def _get_freezer_info(self, sessionKey, query_params):
        logger.debug("START _get_freezer_info()")
        splunk.setDefault('sessionKey', sessionKey)

        freezers_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers?output_mode=json'

        # Get item json
        serverResponse, serverContent = rest.simpleRequest(freezers_uri, sessionKey=sessionKey, method='GET')
        logger.debug("freezers: %s" % serverContent)
        freezers = json.loads(serverContent)

        for freezer in freezers:
            if freezer['id'] == query_params['id']:
                freezer_info = freezer

        return self.response(freezer_info, httplib.OK)
    def _add_freezer(self, sessionKey, user, post_data):
        logger.debug("START _add_freezer()")
        logger.debug('post_data: %s', post_data)
        required = ['freezer_data']
        missing = [r for r in required if r not in post_data]
        if missing:
            return self.response("Missing required arguments: %s" % missing, httplib.BAD_REQUEST)

        freezer_data = post_data.pop('freezer_data')

        splunk.setDefault('sessionKey', sessionKey)

        # Parse the JSON
        #item_data = json.loads(item_data)
        #logger.debug('item_data: %s', item_data)

        items_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers'

        serverResponse, serverContent = rest.simpleRequest(items_uri, sessionKey=sessionKey, jsonargs=freezer_data, method='POST')
        logger.debug("new_freezer: %s" % serverContent)
        new_freezer = json.loads(serverContent)
        return self.response(new_freezer, httplib.OK)

    def _update_freezer(self, sessionKey, user, post_data):
        logger.debug("START _update_freezer()")
        logger.debug('post_data: %s', post_data)
        required = ['freezer_data']
        missing = [r for r in required if r not in post_data]
        if missing:
            return self.response("Missing required arguments: %s" % missing, httplib.BAD_REQUEST)

        freezer_data = json.loads(post_data.pop('freezer_data'))
        logger.debug("freezer_data: %s" % freezer_data)

        splunk.setDefault('sessionKey', sessionKey)

        freezers_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers?output_mode=json'

        # Get freezers json
        serverResponse, serverContent = rest.simpleRequest(freezers_uri, sessionKey=sessionKey, method='GET')
        logger.debug("freezers: %s" % serverContent)
        all_freezers = json.loads(serverContent)

        logger.debug("all_freezers: %s" % all_freezers)
        for freezer in all_freezers:
            logger.debug("freezer: %s" % freezer)
            if freezer['id'] == freezer_data['id']:
                update_freezer = freezer

        for key in freezer_data:
            update_freezer[key] = freezer_data[key]

        freezer_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers/%s' % update_freezer['_key']
        logger.debug("freezer_uri: %s" % freezer_uri)

        update_freezer = json.dumps(update_freezer)

        serverResponse, serverContent = rest.simpleRequest(freezer_uri, sessionKey=sessionKey, jsonargs=update_freezer, method='POST')
        freezer_updated = json.loads(serverContent)
        logger.debug("freezer_updated: %s" % json.dumps(freezer_updated))
        return self.response(freezer_updated, httplib.OK)

    def _delete_freezer(self, sessionKey, query_params):
        logger.debug("START _delete_freezer()")
        required = ['_key','id']
        missing = [r for r in required if r not in query_params]
        if len(missing) > 1:
            return self.response("Missing a required argument: %s" % missing, httplib.BAD_REQUEST)

        splunk.setDefault('sessionKey', sessionKey)

        if '_key' in query_params:
            freezer_id = query_params.pop('_key')
        else:
            freezer_id = query_params.pop('id')
            all_freezers = self._get_freezers(sessionKey, query_params)
            logger.debug("all_freezers: %s" % all_freezers)
            for freezer in all_freezers['payload']:
                if freezer['id'] == freezer_id:
                    freezer_id = freezer['_key']

        freezer_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers/%s' % freezer_id
        logger.debug("freezer_uri: %s" % freezer_uri)

        freezer_removed = {'_key': freezer_id, 'action': "removed"}

        serverResponse, serverContent = rest.simpleRequest(freezer_uri, sessionKey=sessionKey, method='DELETE')
        logger.debug("freezer_removed: %s" % json.dumps(freezer_removed))
        return self.response(freezer_removed, httplib.OK)

    def _get_default_freezer(self, sessionKey, query_params):
        logger.debug("START _get_default_freezer()")
        splunk.setDefault('sessionKey', sessionKey)

        freezers_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers?output_mode=json'

        # Get item json
        serverResponse, serverContent = rest.simpleRequest(freezers_uri, sessionKey=sessionKey, method='GET')
        logger.debug("freezers: %s" % serverContent)
        freezers = json.loads(serverContent)

        default_count = 0
        default_freezer = {}

        for freezer in freezers:
            if (freezer['default']):
                default_count += 1
                default_freezer = freezer

        if (default_count == 1):
            return self.response(default_freezer, httplib.OK)
        else:
            msg = 'Invalid default count: count="{}"'.format(default_count)
            logger.exception(msg)
            return self.response(msg, httplib.BAD_REQUEST)

    def _set_default_freezer(self, sessionKey, user, post_data):
        logger.debug("START _set_default_freezer()")
        logger.debug('post_data: %s', post_data)
        required = ['freezer_data']
        #required = ['_key','id']
        missing = [r for r in required if r not in post_data]
        if missing:
            logger.exception("Missing required arguments: %s" % missing)
            return self.response("Missing required arguments: %s" % missing, httplib.BAD_REQUEST)

        freezer_data = json.loads(post_data.pop('freezer_data'))
        logger.debug("input_freezer_data: %s" % freezer_data)

        splunk.setDefault('sessionKey', sessionKey)

        freezers_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers?output_mode=json'

        # Get item json
        serverResponse, serverContent = rest.simpleRequest(freezers_uri, sessionKey=sessionKey, method='GET')
        logger.debug("freezers: %s" % serverContent)
        freezers = json.loads(serverContent)

        update_data = []

        for freezer in freezers:
            if 'id' in freezer_data:
                if (freezer["id"] == freezer_data["id"]):
                    freezer["default"] = True
                    update_data.append(freezer)
                else:
                    freezer["default"] = False
                    update_data.append(freezer)
            if '_key' in freezer_data:
                if (freezer["_key"] == freezer_data["_key"]):
                    freezer["default"] = True
                    update_data.append(freezer)
                else:
                    freezer["default"] = False
                    update_data.append(freezer)

        update_data = json.dumps(update_data)

        logger.debug("update_data: %s" % update_data)

        update_uri = '/servicesNS/nobody/FreezerInventoryAppForSplunk/storage/collections/data/freezers/batch_save'

        serverResponse, serverContent = rest.simpleRequest(update_uri, sessionKey=sessionKey, jsonargs=update_data, method='POST')
        logger.debug("batch_update: %s" % serverContent)
        freezers_updated = json.loads(serverContent)
        return self.response(freezers_updated, httplib.OK)

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
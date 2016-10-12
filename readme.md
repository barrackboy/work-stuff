#Sonera IOT readme

##Install project

1. Install NodeJS
2. Install Bower
3. Git clone project https://app.deveo.com/eficode/projects/teliasonera_iot_poc/
4. run command "npm install"
5. run command "npm start"
6. browse to localhost:8080
7. Happy Devving!

##Readme
"npm start" or "grunt" will start dev server and watch process
Grunt server has livereload set up, so if file is changed it is automatically loaded on browser.
Grunt server serves from "dist" folder and grunt builds all needed files there.

### Adding new library
Add vendor JS and CSS files in grunt corresponding tasks, then restart grunt.

This project is built on top of Cumulocity Smart apps toolkit:
http://resources.cumulocity.com/documentation/jssdk/latest/#/

current app is using: https://your.soneraiox.fi/

##WINDOWS USER
Grunt task imagecopy is going to copy program files folder under dist/img so remove the folder!

##Production
1. Remove livereload.js from index.html
2. Build production package with command "grunt build" which creates zip package in project root, that can be uploaded to CumulocityUI

##TODO:
See trelloboard: https://trello.com/b/09UhOufX/pilotui

##General good to know stuff
To create new alarm do a POST to: https://your.soneraiox.fi/alarm/alarms

{
  "type" : "com_cumulocity_events_TamperEvent",
  "time" : "2011-09-06T12:03:27.845Z",
  "text" : "Tamper sensor triggered",
  "status" : "ACTIVE",
  "severity" : "MAJOR",
  "source" : { "id" : "10215", "self" : "..." }
}

To find user dashboard settings do GET to: https://your.soneraiox.fi/inventory/managedObjects/?type=userDashboardSettings&owner=eficode

To Delete managedObject do DELETE to: https://your.soneraiox.fi/inventory/managedObjects/IDHERE

To see all managedObjects do GET: https://your.soneraiox.fi/inventory/managedObjects

###Restrict by groups:
ng-if="currentUserRoles.indexOf('admins') >= 0" Shows element only if admin user in rootScope
ng-if="!isReader" Hides element from reader user in rootScope

###Saving dashboard:
Saving dashboard creates new managedobject, in inventory. "viewer" users are not allowed to create new managedobjects by default, so if "viewer" wants to save dashboard, admin user must grant them "create" access for "Inventory" in user group settings on cumulocity side. https://your.soneraiox.fi/apps/administration/index.html#/usergroups/3

###Device location:
c8y_Position is not usable by default. It needs to be activated on the device first. This is planned to do on the UI later.

###Maps use: https://github.com/tombatossals/angular-leaflet-directive

###Restarting device with promises

c8yDeviceControl.createWithNotifications(operation)
  .then(function (operationPromises) {
    operationPromises.created.then( UNDERSCOREHERE.partial(c8yAlert.success, 'Operation ' + operation.description + ' has been created!'));
    operationPromises.completed.then(function (operationResult) {
      if (operationResult.status === c8yDeviceControl.status.SUCCESSFUL) {
        handleSuccess();
     } else if (operationResult.status === c8yDeviceControl.status.FAILED) {
       handleFailure();
    }
  });
});

###Removing devices
your.soneraiox.fi tenant has a gateway with MAC address b827ebb493ae which can be registered/de-registered.

De-registration happens via Cumulocity UI -> Device Management application -> All devices -> Aistin Gateway 93ae -> Configuration and editing asdb.conf section: "SoneraCumulocity": {
"gatewayName": "",
"gatewayID": "",
"externalID": "",
"username": "",
"tenantId": "your",
"credentialsTenantId": "ioxdevices",
"host": "soneraiox.fi",
"port": 443
and press Save.

In the Cumulocity UI, remove the device also from Device Management -> Device credentials.

Now device should be ready for re-registering.

###Corresponding user group ID
left side: cumulocity group, right side: this app groups
1. business = user
2. admins = admin
3. readers = viewer
4. devices = not used

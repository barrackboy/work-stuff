//This fixes Cumulocity c8yInventory bug in Cumulocity SDK
angular.module('soneraiox')
.factory('c8yManagedObject', ['c8yInventory', function (c8yInventory) {
return c8yInventory;
}]
);

(function () {
  'use strict';
  angular.module('soneraiox').controller('LoginCtrl', function($location, c8yUser, $scope){

    this.credentials = {};
    this.onSuccess = function () {
      c8yUser.current().then(function () {
        $location.path('/');
      }).catch(function () {
        $('.alert-danger').slideDown("fast").delay(5000).fadeOut('slow');
      });
    };

});
})();

var Hook     = require('hook.io').Hook,
    CronHook = require('hook.io-cron').CronHook,
    util     = require('util');


var cron = new CronHook( { name: "pinger-cron" } );

var PingerHook = exports.PingerHook = function(options){

  var self = this;

  Hook.call(self, options);

  self.ERROR_TOLERANCE = 5;

  self.on('hook::ready', function(){

    //
    // When the hook is ready, spawn up a couple children
    //
    self.spawn(['cron', 'request'], function(err){
      if(err){
        console.log(err);
      }
    });
  });

  //
  // When the children are ready, call the internal _start() method
  //
  self.on('children::ready', function(){
    self._start();
  });

  //
  // Register a listener for the eventual request that comes back
  //
  self.on('*::gotResponse', function(data){

    //
    // When the request comes back, log what happened...
    //
    var sites = self.config.get('sites');

    //
    // Update the sites object in memory
    //
    for (var site in sites) {
      if(sites[site].name === data.hook.name) {

        //
        // If we got back an error, determine if we've exceeded the tolerance for that application
        //
        if (data.err || (data.statusCode == "500")) {

          sites[site].errorCount == sites[site].errorCount || 0;
          sites[site].errorCount ++;
          
          if (!data.err) {
            data.err = 'Unknown error';
          }

          if (sites[site].errorCount == self.ERROR_TOLERANCE) {

            //
            // If we have exceeded the ERROR_TOLERANCE for the site,
            // then emit the alert error event
            //
            self.emit('siteDown', sites[site]);
          }

        }
        else {

          if (sites[site].errorCount >= self.ERROR_TOLERANCE) {
            //
            // If the site has come back online and we are in an error state,
            // then we need to send the siteBackOnline alert
            //
            self.emit('siteBackOnline', sites[site]);
          }
          sites[site].errorCount = 0;
        }

        sites[site].pongs = sites[site].pongs || 0;
        sites[site].pongs ++;
        sites[site].requestTime = data.requestTime;
        sites[site].statusCode  = data.statusCode;
        sites[site].err         = data.err;
        //self.emit('gotPong', sites[site]);
      }
    }
    self.config.save();

  });

  //
  // Register a listener to keep track of how many outgoing requests we are trying
  //
  self.on('*::request', function(data){

    //
    // When the request comes back, log what happened...
    //
    var sites = self.config.get('sites');
    for (var site in sites) {
      if(sites[site].name === data.name) {
        sites[site].attempts = sites[site].attempts || 0;
        sites[site].attempts ++;
        sites[site].requestTime = data.requestTime; 
      } else {
        //console.log('no dice');
      }
    }

    self.config.save();

  });


};

// PingerHook inherits from Hook
util.inherits(PingerHook, Hook);

PingerHook.prototype._start = function(){
  
  var self = this;
  
  var sites = self.config.get('sites');
  
  if(sites){
    
    for (var site in sites) {

      //
      //  Reset some values on startup
      //
      sites[site].errorCount = 0;
      //
      // Register a cron job for each site object
      //
      self.emit('addJob', { event: 'sendRequest', data: sites[site] })
    }
    
    self.config.save();

  }
  
};

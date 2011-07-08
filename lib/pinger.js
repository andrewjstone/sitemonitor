var Hook     = require('hook.io').Hook,
    CronHook = require('hook.io-cron').CronHook,
    util     = require('util');


var cron = new CronHook( { name: "pinger-cron" } );

var PingerHook = exports.PingerHook = function(options){

  for (var o in options) {
    this[o] = options[o];
  }

  Hook.call(this);

  var self = this;

  self.ERROR_TOLERANCE = 5;

  self.on('ready', function(){
      self.spawn(['cron', 'request'], function(){
      self._start();
    });
  });

  //
  // Register a listener for the eventual request that comes back
  //
  self.on('i.gotResponse.o.gotResponse', function(source, event, data){

    //
    // When the request comes back, log what happened...
    //
    var sites = self.get('sites');

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
            self.emit('o.siteDown', sites[site]);
          }

        }
        else {

          if (sites[site].errorCount >= self.ERROR_TOLERANCE) {
            //
            // If the site has come back online and we are in an error state,
            // then we need to send the siteBackOnline alert
            //
            self.emit('o.siteBackOnline', sites[site]);
          }
          sites[site].errorCount = 0;
        }

        sites[site].pongs = sites[site].pongs || 0;
        sites[site].pongs ++;
        sites[site].requestTime = data.requestTime;
        sites[site].statusCode  = data.statusCode;
        sites[site].err         = data.err;
        self.emit('o.gotPong', sites[site]);
      }
    }
    self.save();

  });

  //
  // Register a listener to keep track of how many outgoing requests we are trying
  //
  self.on('i.request.o.request', function(source, event, data){

    //
    // When the request comes back, log what happened...
    //
    var sites = self.get('sites');
    for (var site in sites) {
      if(sites[site].name === data.name) {
        sites[site].attempts = sites[site].attempts || 0;
        sites[site].attempts ++;
        sites[site].requestTime = data.requestTime; 
      } else {
        //console.log('no dice');
      }
    }

    self.save();

  });


};

// PingerHook inherits from Hook
util.inherits(PingerHook, Hook);

PingerHook.prototype._start = function(){
  
  var self = this;
  
  var sites = self.get('sites');
  
  if(sites){
    
    for (var site in sites) {

      //
      //  Reset some values on startup
      //
      sites[site].errorCount = 0;
      //
      // Register a cron job for each site object
      //
      self.emit('o.addJob', { event: 'o.request', data: sites[site] })

    }
    
    self.save();
  }
  
};

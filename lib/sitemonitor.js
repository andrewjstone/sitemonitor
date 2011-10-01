var Hook     = require('hook.io').Hook,
    CronHook = require('hook.io-cron').CronHook,
    util     = require('util');

var cron = new CronHook( { name: "sitemonitor-cron" } );

var SiteMonitorHook = exports.SiteMonitorHook = function(options){

  var self = this;

  Hook.call(self, options);

  self.ERROR_TOLERANCE = 5;

  self.hooks = ['cron', 'request'];

  self.on('hook::ready', function(){

    //
    // When the children are spawned, call the internal _start() method
    //
    self._start();

  });

  //
  // Register a listener for the eventual request that comes back
  //
    
  self.on('*::http::request::error', function(err){

    var sites = self.sites;

    for (var site in sites) {

      if(err.ctx.name === sites[site].name){

        sites[site].errorCount = sites[site].errorCount || 0;
        sites[site].errorCount ++;
        sites[site].err = err;
        
        if (sites[site].errorCount == self.ERROR_TOLERANCE) {
          //
          // If we have exceeded the ERROR_TOLERANCE for the site,
          // then emit the alert error event
          //
          self.emit('site::down', sites[site]);
        }
      }
    }
    
    self.config.save();
    
  });
  
  self.on('*::http::request::result', function(data){

    //
    // When the request comes back, log what happened...
    //
    var sites = self.sites;

    for (var site in sites) {


      if(sites[site].name === data.ctx.name) {

        //
        // If we got back an error, determine if we've exceeded the tolerance for that application
        //
        if (data.statusCode == "500") {
          //
          // TODO: report error
          //
        }
        
        if (sites[site].errorCount >= self.ERROR_TOLERANCE) {
          //
          // If the site has come back online and we are in an error state,
          // then we need to send the siteBackOnline alert
          //
          self.emit('site::backOnline', sites[site]);
        }
        
        sites[site].errorCount = 0;
        sites[site].pongs = sites[site].pongs || 0;
        sites[site].pongs ++;
        sites[site].requestTime = data.requestTime;
        sites[site].statusCode  = data.statusCode;
      }
    }
    
    //
    // Persist changes to disk
    //
    self.config.save();

  });

  //
  // Register a listener to keep track of how many outgoing requests we are trying
  //
  self.on('*::http::request', function(data){

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

// SiteMonitorHook inherits from Hook
util.inherits(SiteMonitorHook, Hook);

SiteMonitorHook.prototype._start = function(){
  var self = this;
  
  var sites = self.sites;
  
  if(sites){
    
    for (var site in sites) {

      //
      //  Reset some values on startup
      //
      sites[site].errorCount = 0;
      //
      // Register a cron job for each site object
      //
      
      self.emit('jobs::add', {
        event: 'http::request',
        data: sites[site]
      });
    }
    
  }
  
};

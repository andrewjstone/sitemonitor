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
    for (var site in sites) {
      if(sites[site].name === data.hook.name) {
        sites[site].pongs = sites[site].pongs || 0;
        sites[site].pongs ++;
        sites[site].requestTime = data.requestTime;
        sites[site].statusCode  = data.statusCode;
        sites[site].err         = data.err;
        self.emit('o.gotPong', sites[site]);
        
      } else {
        //console.log('no dice');
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
    
    sites.forEach(function(site){

      //
      // Register a cron job for each site object
      //
      
      self.emit('o.addJob', { event: 'o.request', data: site })

    });
    
  }
  
};

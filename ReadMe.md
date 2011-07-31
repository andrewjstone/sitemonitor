## hook.io-pinger

*a Hook that will ping urls on set intervals. useful for HTTP monitoring*

## Installation

     npm install hook.io-pinger -g

## Usage

     hookio-pinger

## Hook Events Names

**siteDown** *event emitted when a site goes down*

**siteUp** *event emitted when a site comes back online from being down*

## Hook config.json settings
``` js

{ 
  "sites": [
   {
     "name": "Google",
     "url": "http://google.com/"
   },
   {
     "name": "Github",
     "url": "http://www.github.com/"
   }
  ]
}

```

## Required Hooks

  - [cron](http://github.com/hookio/cron)
  - [request](http://github.com/hookio/request)



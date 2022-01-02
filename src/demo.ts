import './udp/deno.implementation.ts'

import {Client as LifxClient} from './lifx/client.ts'

const client = new LifxClient({
  discoveryInterval: 5000,
  address: '0.0.0.0',
  debug: true
});

client.on('log', ({message}) => console.log(message))
client.on('light-new', function(light) {
  console.log("light found!!")
  const switchLight = async ()=>{
    const power = await light.getPower()
    if(power){
      light.turnOff(2000)
    } else {
      light.turnOn(2000)
    }
  }

  switchLight()
  setInterval(switchLight, 2500)
});

client.init();
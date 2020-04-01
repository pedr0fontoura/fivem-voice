# vRost
A FiveM voice chat script using Mumble's API

![Preview of the UI](https://i.imgur.com/7JNxvM3.png)

**Current Features**
- Proximity Based Voice Targeting (Temporal until a stable grid system is achievable)
- Frequency Based Radio System
- Per Frequency Access Control
- Remote and Local Radio Clicks
- Basic Phone System
- UI for Radio Frequencies and Voice Range


**Upcoming Features**
- [ ] Phone Loudspeaker
- [ ] Radio Eavesdropping
- [ ] Grid Based Voice Targeting
- [ ] Suggestions?

**Client Exports**

| Export              | Parameters   |
|---------------------|--------------|
| SetRadioPowerState  | state (bool) |
| SetRadioVolume      | volume (int) |

**Server Exports**

| Export                      | Parameters                               |
|-----------------------------|------------------------------------------|
| SetPlayerRadioPowerState    | serverID (int), state (bool)             |
| SetPlayerRadioVolume        | serverID (int), volume (int)             |
| RegisterRadioFrequency      | frequency (string), authorization (func) |
| AddPlayerToRadio            | serverID (int), frequency (string)       |
| RemovePlayerFromRadio       | serverID (int), frequency (string)       |
| RemovePlayerFromAllRadios   | serverID (int)                           |
| StartPhoneCall              | playerA (int), playerB (int)             |
| EndPhoneCall                | callID (string)                          |

## Usage
**Note:** This is mostly a developer resource, if you are coming from TokoVOIP or want a quick start, I recommend you to also check out my [Toko wrapper](https://github.com/xIAlexanderIx/tokovoip_wrapper)

**Default Hotkeys**
- Cycle Voice Range: **Z**
- Cycle Radio Channels: **I**
- Transmit to Radio: **CAPSLOCK**

**Range Indicator**
- Green: **Normal** (Default 6 Units)
- Orange: **Shout** (Default 24 Units)
- Purple: **Whisper** (Default 3 Units)

**Radio Indicator**
- White: **Idle**
- Red: **Transmitting**

## Frequency Access Control

Its possible to restrict the access of a specific frequency just by using **"RegisterRadioFrequency"**, all you need to do is to include your authorization method while registering the frequency, this gives you the freedom to make a custom authorization procedure that fits your needs.

Every authorization method is invoked with three parameters:
1. The Server ID of the player that is trying to connect
2. The frequency that is being authorized
3. The amount of players connected to the frequency

### Examples

Require to have an item in the player's inventory (Using ESX Framework as Example)

```lua
Citizen.CreateThread(function()
    RegisterRadioFrequency("153.6", function(source, frequency, size)
        local player = ESX.GetPlayerFromId(source)

        local item = player.getInventoryItem("radio")
        
        return item.count >= 1   
    end)
end)
```

Require an item and restrict to a specific job (Using ESX Framework as Example)

```lua
Citizen.CreateThread(function()
    RegisterRadioFrequency("911.1", function(source, frequency, size)
        local player = ESX.GetPlayerFromId(source)

        local item = player.getInventoryItem("radio")
        
        return item.count >= 1 and player.job.name == "police"    
    end)
end)

```

Restrict the amount of players that can use the frequency

```lua
Citizen.CreateThread(function()
    RegisterRadioFrequency("420.0", function(source, frequency, size)
        return size < 15 
    end)
end)

```

## Credits

- Zirconium for providing the base snippet of the grid system (Not available in this release)
- TokoVOIP for some of the inspiration

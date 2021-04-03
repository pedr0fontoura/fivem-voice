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

**ConVars**

| Export                     | Default | Description                                                                                         | Parameter |
| -------------------------- | ------- | --------------------------------------------------------------------------------------------------- | --------- |
| voice_debugMode            | 0       | 1: log, 2: verbose                                                                                  | int       |
| voice_enableRadioModule    | 1       | Enable radio                                                                                        | int       |
| voice_enablePhoneModule    | 1       | Enable phone                                                                                        | int       |
| voice_enableNUIModule      | 1       | Enable built in UI, if disabled exposes voice:ui:update event to use the data on your own interface | int       |
| voice_enableSubmixModule   | 1       | Enable audio submixing                                                                              | int       |
| voice_enableRemoteClickOn  | 1       | Enable radio remote click on transmittion start                                                     | int       |
| voice_enableRemoteClickOff | 1       | Enable radio remote click on transmittion end                                                       | int       |
| voice_cycleProximityHotkey | Z       | Default key to cycle through voice proximity                                                        | string    |
| voice_cycleFrequencyHotkey | I       | Default key to cycle through radio frequencies                                                      | string    |
| voice_toggleRadioHotkey    | CAPITAL | Default key to use the radio                                                                        | string    |
| voice_locale               | pt-BR   | Locales for RegisterKeyMapping and built in UI                                                      | string    |

**Client Exports**

| Export             | Parameters   | Return |
| ------------------ | ------------ | ------ |
| setRadioPowerState | state (bool) | void   |
| setRadioVolume     | volume (int) | void   |

**Server Exports**

| Export                    | Parameters                               | Return          |
| ------------------------- | ---------------------------------------- | --------------- |
| setPlayerRadioPowerState  | serverID (int), state (bool)             | void            |
| setPlayerRadioVolume      | serverID (int), volume (int)             | void            |
| registerRadioFrequency    | frequency (string), authorization (func) | void            |
| addPlayerToRadio          | serverID (int), frequency (string)       | void            |
| removePlayerFromRadio     | serverID (int), frequency (string)       | void            |
| removePlayerFromAllRadios | serverID (int)                           | void            |
| startPhoneCall            | playerA (int), playerB (int)             | callId (string) |
| endPhoneCall              | callID (string)                          | void            |

**Default Hotkeys**

- Cycle Voice Range: **Z**
- Cycle Radio Channels: **I**
- Transmit to Radio: **CAPSLOCK**

**Range Indicator**

- Green: **Normal**
- Orange: **Shout**
- Purple: **Whisper**

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

- d-bub for providing the base snippet of the grid system
- [xIAlexanderIx](https://github.com/xIAlexanderIx) for vRost, the original resource that fivem-voice is built on top of.

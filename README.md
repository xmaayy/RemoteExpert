# Remote Expert
![Remote Expert](docs/Logos/01.jpg)
# Hardware software requirements
The base-station software can be run on any desktop computer running Windows, Mac or Linux. The base-station library additionally can be used in any environment that 

The Remote Technician can be run on a Microsoft HoloLens 1 or 2. It can only be compiled on a computer running Windows due to some of the dependencies being not being compatible with Mac or Linux.

# Installation
## Clone the Remote Expert repository
Clone the repository with
```git clone https://github.com/xmaayy/RemoteExpert.git```

## Desktop
Install dependencies with:
```npm install```

## Hololens
### Dependencies
#### Install Unity 2017
Ensure that you are installing unity 2017 if you are using the Hololens 1
(Unity Installer)[https://unity3d.com/get-unity/download]
#### Install Visual Studio
(Visual Studio)[https://visualstudio.microsoft.com/downloads/]

### Remote Expert
Open unity and import the "unity" folder as a project into it

# Compile the Example Application
## Compile the Hololens Application
In unity open the RemoteExpertTemplate.unity Scene.

Select Project -> Build Settings
Select "Add open scenes"
Select "Build"
Create a new folder "Example Application"
Select the newly created folder

Open the folder in Visual Studio
Plug in your Microsoft Hololens
Select "Device" "x86" and Click the Run button

# Run the Example Application
## Run the Signalling server
```cd signaling-server```
```npm run start```
## Run the electron application
```cd electron```
```npm run electron```
## Run the HoloLens application
On the HoloLens open RemoteExpert

# Connecting
## Base Station
In the electron application click "Start Session"

Copy the generated QR code and send it to the person using the Hololens

## Remote Agent
Scan the QR code sent to you by the base-station operator

The connection will be made and a video connection will start!

# Extension

The focus of this project was to create an extensible library for remote controlling a Hololens view from a desktop application.
You can find the extension descriptions in the readmes in the respective folders
JS is in the remote-expert-js folder
Unity is in the unity folder

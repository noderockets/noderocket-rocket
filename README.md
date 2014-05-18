noderocket-rocket
=================

This is the control software for the [noderockets](http://www.noderockets.com/) water rocket.

Read more about it at http://www.noderockets.com/

This project uses a Raspberry Pi in a soda bottle water rocket to do the following:
- Measure the altitude of the rocket.
- Deploy a parachute soon after rocket apogee.
- Take pictures/video during flight.

Preconfigured Image
-------------------
We have an SD card image all ready for you that has all of this pre-configured.  You can download it at http://download.me.

You need an SD card that's at least 4GB.  Install the image to your SD card using [the Raspbian installation instructions.](http://www.raspberrypi.org/documentation/installation/installing-images/README.md)

Making Your Own
---------------

__Install Raspbian__

1. You need an SD card that's at least 4GB.
2. Download the base Raspbian distribution from http://www.raspberrypi.org/downloads/
3. Install Raspbian to your SD card using [these instructions](http://www.raspberrypi.org/documentation/installation/installing-images/README.md)
4. Put the card in your Raspberry Pi.
5. Plug the Pi into your network - it's already configured for DHCP.
6. Connect the power to the Pi.
7. If you have a monitor and keyboard connected to the Raspberry Pi you can login as user pi with password raspberry.  Otherwise you can check your router for the Pi's IP address and connect vi ssh using the same user and password.

__Install Prerequisites__

1. First update the OS:

  ```bash
sudo apt-get update
sudo apt-get upgrade
  ```
  
2. Checkout and build pi-blaster.  Pi-blaster enables PWM on the digital GPIO pins, making it possible to control a servo motor.

  ```bash
git clone https://github.com/sarfata/pi-blaster.git
cd pi-blaster
sudo make install
  ```
  
  Pi-blaster will now start automatically on reboot.
  
3. Enable the GPIO i2c modules.  Edit /etc/modules:

  ```bash
sudo nano /etc/modules
  ```

  You need to add these two entries to the file:
  
  ```bash
i2c-bcm2708
i2c-dev
  ```

  Edit /etc/modprobe.d/raspi-blacklist.conf
  ```bash
sudo nano /etc/modprobe.d/raspi-blacklist.conf
  ```

  You need to make sure the following entries are commented out in the file:
  ```bash
#blacklist spi-bcm2708
#blacklist i2c-bcm2708
  ```

3. Download and install nodejs.

  ```bash
cd ~
sudo wget http://node-arm.herokuapp.com/node_latest_armhf.deb
sudo dpkg -i node_latest_armhf.deb
  ```

4. Reboot

  ```bash
sudo reboot
  ```

__Rocket Software__

Clone and build the noderocket-rocket project:

```bash
git clone https://github.com/noderockets/noderocket-rocket.git
cd noderocket-rocket
npm install
```

This takes quite a while as it downloads and builds all of the dependencies.

You need to run the project as root for it to have access to the GPIO pins.

```bash
sudo node server.js
```

You can access the rocket UI by entering the Pi's IP address into your browser.

_Make the rocket software run automatically_

1. Install forever globally:

  ```bash
sudo npm install -g forever
  ```

2. Copy and install the init.d script to start and stop the rocket:

  ```bash
sudo cp etc/rocket /etc/init.d
sudo chmod +x /etc/init.d/rocket
sudo update-rc.d rocket defaults
  ```

3. If you didn't clone the rocket project to /home/pi/noderocket-rocket, edit /etc/init.d/rocket and point ROCKET_HOME to the correct path.

__Configuring the Camera__

1. Enable the camera by running:

  ```bash
sudo raspi-config
  ```
  
  Follow the menu to enable the camera, then finish.
  
2. Reboot the Pi.
3. Install some packages:

  ```bash
sudo apt-get install libjpeg62-dev
sudo apt-get install cmake
  ```
  
4. Clone and build the MJPG Streamer project.  This is an experimental version that uses the raspicam input plugin.

  ```bash
git clone https://github.com/jacksonliam/mjpg-streamer.git
cd mjpg-streamer
sudo make install
  ```

5. Run the streamer with this command:

  ```bash
mjpg_streamer -o "output_http.so -w /usr/local/www" -i "input_raspicam.so -fps 15 -q 50 -x 640 -y 480"
  ```
  
  This will run the streamer with a frame rate of 15 and an image size of 640x480.  This gives a pretty good result with low load on the Pi.  You can look up the other input options at https://github.com/jacksonliam/mjpg-streamer.
  
6. Open the streamer in your browser at the Pi's address, port 8080 - http://pi_address:8080

_Make the camera software run automatically_

1. Copy and install the init.d script to start and stop the camera:

  ```bash
sudo cp etc/mjpg_streamer /etc/init.d
sudo chmod +x /etc/init.d/mjpg_streamer
sudo update-rc.d mjpg_streamer defaults
  ```
  

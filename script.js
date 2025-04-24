// Initialize charts when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create accelerometer chart
    const accelChart = Highcharts.chart('accelerometer-chart', {
      chart: {
        type: 'line',
        animation: false,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        style: {
          fontFamily: 'Arial, sans-serif'
        }
      },
      title: {
        text: null
      },
      time: {
        useUTC: false
      },
      xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        gridLineColor: 'rgba(255, 255, 255, 0.1)',
        labels: {
          style: {
            color: '#FFFFFF'
          }
        }
      },
      yAxis: {
        title: {
          text: 'Acceleration (g)',
          style: {
            color: '#FFFFFF'
          }
        },
        gridLineColor: 'rgba(255, 255, 255, 0.1)',
        labels: {
          style: {
            color: '#FFFFFF'
          }
        }
      },
      legend: {
        enabled: true,
        itemStyle: {
          color: '#FFFFFF'
        }
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        line: {
          marker: {
            enabled: false
          }
        }
      },
      series: [{
        name: 'X-Axis',
        color: '#FF4560',
        data: []
      }, {
        name: 'Y-Axis',
        color: '#00E396',
        data: []
      }, {
        name: 'Z-Axis',
        color: '#008FFB',
        data: []
      }]
    });
  
    // Create gyroscope chart
    const gyroChart = Highcharts.chart('gyroscope-chart', {
      chart: {
        type: 'line',
        animation: false,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        style: {
          fontFamily: 'Arial, sans-serif'
        }
      },
      title: {
        text: null
      },
      time: {
        useUTC: false
      },
      xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        gridLineColor: 'rgba(255, 255, 255, 0.1)',
        labels: {
          style: {
            color: '#FFFFFF'
          }
        }
      },
      yAxis: {
        title: {
          text: 'Angular Velocity (deg/s)',
          style: {
            color: '#FFFFFF'
          }
        },
        gridLineColor: 'rgba(255, 255, 255, 0.1)',
        labels: {
          style: {
            color: '#FFFFFF'
          }
        }
      },
      legend: {
        enabled: true,
        itemStyle: {
          color: '#FFFFFF'
        }
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        line: {
          marker: {
            enabled: false
          }
        }
      },
      series: [{
        name: 'X-Axis',
        color: '#FF4560',
        data: []
      }, {
        name: 'Y-Axis',
        color: '#00E396',
        data: []
      }, {
        name: 'Z-Axis',
        color: '#008FFB',
        data: []
      }]
    });
  
    // Variables to track max values
    let maxAccel = 0;
    let maxGyro = 0;
    
    // Set up EventSource for Server-Sent Events
    if (!!window.EventSource) {
      const source = new EventSource('/events');
      
      source.addEventListener('open', function(e) {
        console.log("Events Connected");
        document.getElementById('connection-status').textContent = "Connected";
        document.getElementById('connection-status').style.color = "#4CAF50";
      }, false);
      
      source.addEventListener('error', function(e) {
        if (e.target.readyState != EventSource.OPEN) {
          console.log("Events Disconnected");
          document.getElementById('connection-status').textContent = "Disconnected";
          document.getElementById('connection-status').style.color = "#FF5252";
        }
      }, false);
      
      // Listen for new sensor readings
      source.addEventListener('new_readings', function(e) {
        console.log("new_readings", e.data);
        const sensorData = JSON.parse(e.data);
        
        // Update timestamp
        const now = new Date();
        document.getElementById('timestamp').textContent = 
          `Last Updated: ${now.toLocaleTimeString()}`;
        
        // Get current time for x-axis
        const x = now.getTime();
        
        // Update accelerometer chart
        accelChart.series[0].addPoint([x, sensorData.ax], true, accelChart.series[0].data.length > 40);
        accelChart.series[1].addPoint([x, sensorData.ay], true, accelChart.series[1].data.length > 40);
        accelChart.series[2].addPoint([x, sensorData.az], true, accelChart.series[2].data.length > 40);
        
        // Update gyroscope chart
        gyroChart.series[0].addPoint([x, sensorData.gx], true, gyroChart.series[0].data.length > 40);
        gyroChart.series[1].addPoint([x, sensorData.gy], true, gyroChart.series[1].data.length > 40);
        gyroChart.series[2].addPoint([x, sensorData.gz], true, gyroChart.series[2].data.length > 40);
        
        // Update current values
        document.getElementById('ax-value').textContent = sensorData.ax.toFixed(2);
        document.getElementById('ay-value').textContent = sensorData.ay.toFixed(2);
        document.getElementById('az-value').textContent = sensorData.az.toFixed(2);
        document.getElementById('gx-value').textContent = sensorData.gx.toFixed(2);
        document.getElementById('gy-value').textContent = sensorData.gy.toFixed(2);
        document.getElementById('gz-value').textContent = sensorData.gz.toFixed(2);
        
        // Update vehicle orientation
        updateVehicleOrientation(sensorData.gx, sensorData.gy, sensorData.gz);
        
        // Update max values
        const currentAccel = Math.sqrt(
          Math.pow(sensorData.ax, 2) + 
          Math.pow(sensorData.ay, 2) + 
          Math.pow(sensorData.az, 2)
        );
        
        const currentGyro = Math.max(
          Math.abs(sensorData.gx),
          Math.abs(sensorData.gy),
          Math.abs(sensorData.gz)
        );
        
        if (currentAccel > maxAccel) {
          maxAccel = currentAccel;
          document.getElementById('max-accel').textContent = maxAccel.toFixed(2) + ' g';
        }
        
        if (currentGyro > maxGyro) {
          maxGyro = currentGyro;
          document.getElementById('max-gyro').textContent = maxGyro.toFixed(2) + ' deg/s';
        }
      }, false);
    }
    
    // Function to update vehicle orientation based on gyroscope data
    function updateVehicleOrientation(gx, gy, gz) {
      const vehicle = document.querySelector('.vehicle-model');
      
      // Scale down the rotation values for better visualization
      const rotateX = gy * 0.5; // Pitch (around X-axis)
      const rotateY = gx * 0.5; // Roll (around Y-axis)
      const rotateZ = gz * 0.5; // Yaw (around Z-axis)
      
      vehicle.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    }
  });
  
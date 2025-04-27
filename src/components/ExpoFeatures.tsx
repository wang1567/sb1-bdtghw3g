import React, { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { MaterialIcons } from '@expo/vector-icons';

export default function ExpoFeatures() {
  const [hasPermissions, setHasPermissions] = useState<{
    camera: boolean;
    location: boolean;
    mediaLibrary: boolean;
  }>({
    camera: false,
    location: false,
    mediaLibrary: false,
  });
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);

  useEffect(() => {
    requestPermissions();
    setupSensors();

    return () => {
      Accelerometer.removeAllListeners();
    };
  }, []);

  const requestPermissions = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    const locationStatus = await Location.requestForegroundPermissionsAsync();
    const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();

    setHasPermissions({
      camera: cameraStatus.status === 'granted',
      location: locationStatus.status === 'granted',
      mediaLibrary: mediaLibraryStatus.status === 'granted',
    });

    if (locationStatus.status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }
  };

  const setupSensors = () => {
    Accelerometer.setUpdateInterval(1000);
    Accelerometer.addListener(data => {
      setAccelerometerData(data);
    });
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        // 處理選擇的圖片
        const asset = await MediaLibrary.createAssetAsync(result.assets[0].uri);
        console.log('Saved image to library:', asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScannedData(data);
    setShowScanner(false);
  };

  const shareLocation = async () => {
    if (location) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        const fileUri = FileSystem.documentDirectory + 'location.txt';
        await FileSystem.writeAsStringAsync(
          fileUri,
          `Latitude: ${location.coords.latitude}\nLongitude: ${location.coords.longitude}`
        );
        await Sharing.shareAsync(fileUri);
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MaterialIcons name="pets" size={24} color="#4F46E5" />
          寵物相關功能
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <MaterialIcons name="qr-code-scanner" size={24} color="#4F46E5" />
            <span>掃描寵物晶片</span>
          </button>

          <button
            onClick={handleImagePick}
            className="flex items-center gap-2 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <MaterialIcons name="add-a-photo" size={24} color="#4F46E5" />
            <span>新增寵物照片</span>
          </button>

          <button
            onClick={shareLocation}
            className="flex items-center gap-2 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <MaterialIcons name="location-on" size={24} color="#4F46E5" />
            <span>分享目前位置</span>
          </button>
        </div>

        {showScanner && hasPermissions.camera && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg w-full max-w-lg">
              <div className="relative h-64">
                <BarCodeScanner
                  onBarCodeScanned={handleBarCodeScanned}
                  style={{
                    height: '100%',
                    width: '100%',
                  }}
                />
              </div>
              <button
                onClick={() => setShowScanner(false)}
                className="mt-4 w-full py-2 bg-red-500 text-white rounded-lg"
              >
                取消掃描
              </button>
            </div>
          </div>
        )}

        {scannedData && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-800">掃描結果</h3>
            <p className="mt-1 text-green-600">{scannedData}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">感測器資料</h2>
        <div className="space-y-4">
          {location && (
            <div>
              <h3 className="font-medium text-gray-700">GPS 位置</h3>
              <p className="text-sm text-gray-600">
                緯度: {location.coords.latitude.toFixed(6)}
                <br />
                經度: {location.coords.longitude.toFixed(6)}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-700">加速度計</h3>
            <p className="text-sm text-gray-600">
              X: {accelerometerData.x.toFixed(2)}
              <br />
              Y: {accelerometerData.y.toFixed(2)}
              <br />
              Z: {accelerometerData.z.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {!hasPermissions.camera && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800">請允許相機權限以使用掃描功能</p>
        </div>
      )}
    </div>
  );
}
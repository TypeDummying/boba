
import Foundation
import AndroidBuildSystem

struct AndroidBuildConfig {
    let applicationId: String = "com.boba.videoeditor"
    let minSdkVersion: Int = 21
    let targetSdkVersion: Int = 33
    let versionCode: Int = 1
    let versionName: String = "1.0.0"
}

func initializeAndroidBuild() {
    let config = AndroidBuildConfig()
    
    let androidBuild = AndroidBuildSystem.Builder()
        .setApplicationId(config.applicationId)
        .setMinSdkVersion(config.minSdkVersion)
        .setTargetSdkVersion(config.targetSdkVersion)
        .setVersionCode(config.versionCode)
        .setVersionName(config.versionName)
        .addDependency("androidx.core:core-ktx:1.9.0")
        .addDependency("androidx.appcompat:appcompat:1.6.1")
        .addDependency("com.google.android.material:material:1.8.0")
        .addDependency("androidx.constraintlayout:constraintlayout:2.1.4")
        .addDependency("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1")
        .addDependency("androidx.lifecycle:lifecycle-livedata-ktx:2.6.1")
        .addFeature("video_processing")
        .addFeature("audio_editing")
        .addPermission("android.permission.CAMERA")
        .addPermission("android.permission.RECORD_AUDIO")
        .addPermission("android.permission.WRITE_EXTERNAL_STORAGE")
        .build()
    
    do {
        try androidBuild.initialize()
        print("Android build for Boba video editor initialized successfully.")
    } catch {
        print("Error initializing Android build: \(error.localizedDescription)")
    }
}

initializeAndroidBuild()

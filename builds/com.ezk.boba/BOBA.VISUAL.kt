
import com.ezk.boba.core.BobaProject
import com.ezk.boba.visual.VideoObject
import com.ezk.boba.visual.effects.VisualEffect
import com.ezk.boba.visual.transitions.Transition

fun initializeBobaVisualObjects(project: BobaProject) {
    // Create video objects
    val mainVideo = VideoObject("main_video.mp4")
    val overlayVideo = VideoObject("overlay.mp4")

    // Add visual effects to main video
    mainVideo.addEffect(VisualEffect.ColorCorrection(brightness = 1.1f, contrast = 1.2f))
    mainVideo.addEffect(VisualEffect.Blur(radius = 5f))

    // Add transition between main video and overlay
    val fadeTransition = Transition.Fade(duration = 1.5f)
    project.addTransition(mainVideo, overlayVideo, fadeTransition)

    // Add video objects to project timeline
    project.timeline.add(mainVideo)
    project.timeline.add(overlayVideo)

    // Set project properties
    project.resolution = Pair(1920, 1080)
    project.frameRate = 30

    println("Boba visual video objects initialized successfully.")
}

import androidx.compose.foundation.layout.*
import androidx.compose.material.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ezk.boba.ui.theme.BobaTheme
import com.ezk.boba.viewmodel.VideoEditorViewModel

@Composable
fun BobaVideoEditorUI() {
    val viewModel: VideoEditorViewModel = viewModel()
    var selectedVideoUri by remember { mutableStateOf<String?>(null) }

    BobaTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colors.background
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Button(
                    onClick = { viewModel.selectVideo { uri -> selectedVideoUri = uri } }
                ) {
                    Text("Select Video")
                }

                selectedVideoUri?.let { uri ->
                    Text("Selected video: $uri")
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Button(onClick = { viewModel.trimVideo(uri) }) {
                            Text("Trim")
                        }
                        Button(onClick = { viewModel.addFilter(uri) }) {
                            Text("Add Filter")
                        }
                        Button(onClick = { viewModel.addAudio(uri) }) {
                            Text("Add Audio")
                        }
                    }

                    Button(
                        onClick = { viewModel.exportVideo(uri) },
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Export")
                    }
                }

                LaunchedEffect(viewModel) {
                    viewModel.uiState.collect { state ->
                        when (state) {
                            is VideoEditorViewModel.UiState.Idle -> {}
                            is VideoEditorViewModel.UiState.Loading -> {
                                // Show loading indicator
                            }
                            is VideoEditorViewModel.UiState.Success -> {
                                // Show success message
                            }
                            is VideoEditorViewModel.UiState.Error -> {
                                // Show error message
                            }
                        }
                    }
                }
            }
        }
    }
}

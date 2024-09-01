
#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>

class VideoLengthHandler {
public:
    static std::string formatDuration(const std::chrono::seconds& duration) {
        auto hours = std::chrono::duration_cast<std::chrono::hours>(duration);
        auto minutes = std::chrono::duration_cast<std::chrono::minutes>(duration % std::chrono::hours(1));
        auto seconds = std::chrono::duration_cast<std::chrono::seconds>(duration % std::chrono::minutes(1));

        std::stringstream ss;
        ss << std::setfill('0') << std::setw(2) << hours.count() << ":"
           << std::setfill('0') << std::setw(2) << minutes.count() << ":"
           << std::setfill('0') << std::setw(2) << seconds.count();
        return ss.str();
    }

    static std::chrono::seconds parseDuration(const std::string& durationStr) {
        std::istringstream iss(durationStr);
        std::string token;
        int hours = 0, minutes = 0, seconds = 0;

        if (std::getline(iss, token, ':')) {
            hours = std::stoi(token);
            if (std::getline(iss, token, ':')) {
                minutes = std::stoi(token);
                if (std::getline(iss, token)) {
                    seconds = std::stoi(token);
                }
            }
        }

        return std::chrono::hours(hours) + std::chrono::minutes(minutes) + std::chrono::seconds(seconds);
    }

    static std::chrono::seconds addDurations(const std::chrono::seconds& duration1, const std::chrono::seconds& duration2) {
        return duration1 + duration2;
    }

    static std::chrono::seconds subtractDurations(const std::chrono::seconds& duration1, const std::chrono::seconds& duration2) {
        return duration1 - duration2;
    }
};

// Example usage
int main() {
    std::chrono::seconds duration1 = VideoLengthHandler::parseDuration("01:30:45");
    std::chrono::seconds duration2 = VideoLengthHandler::parseDuration("00:45:30");

    std::cout << "Duration 1: " << VideoLengthHandler::formatDuration(duration1) << std::endl;
    std::cout << "Duration 2: " << VideoLengthHandler::formatDuration(duration2) << std::endl;

    std::chrono::seconds sum = VideoLengthHandler::addDurations(duration1, duration2);
    std::cout << "Sum: " << VideoLengthHandler::formatDuration(sum) << std::endl;

    std::chrono::seconds diff = VideoLengthHandler::subtractDurations(duration1, duration2);
    std::cout << "Difference: " << VideoLengthHandler::formatDuration(diff) << std::endl;

    return 0;
}

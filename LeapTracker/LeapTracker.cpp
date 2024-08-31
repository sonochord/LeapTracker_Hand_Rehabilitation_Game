//
//  LeapTracker.cpp
//  LeapTracker
//
//  Created by Fergal Davis on 29/07/2024.
//
#include "LeapTracker.hpp"
#include <iostream>
#include <cmath>
#include <algorithm> 
#include <chrono>
#include <sstream>
#include <iomanip>
#include <thread>
#include <stdexcept>
#include <sys/stat.h>
#include <unistd.h>
#include "tinyosc.h"
#include <nlohmann/json.hpp>
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define OUTPUT_BUFFER_SIZE 1024

// Helper functions to compute roll, pitch, and yaw
float computeRoll(const LEAP_VECTOR& normal) {
    return atan2(normal.y, normal.z) * 180.0 / M_PI;
}

float computePitch(const LEAP_VECTOR& direction) {
    return asin(direction.y) * 180.0 / M_PI;
}

float computeYaw(const LEAP_VECTOR& direction) {
    return atan2(direction.x, direction.z) * 180.0 / M_PI;
}

// Helper function to compute wrist angles
float computeWristFlexionExtension(const LEAP_VECTOR& wrist, const LEAP_VECTOR& palm) {
    float dot_product = wrist.y * palm.y + wrist.z * palm.z;
    float magnitude_wrist = std::sqrt(wrist.y * wrist.y + wrist.z * wrist.z);
    float magnitude_palm = std::sqrt(palm.y * palm.y + palm.z * palm.z);
    
    if (magnitude_wrist == 0 || magnitude_palm == 0) {
        return 0;  // or some default value
    }
    
    return std::acos(dot_product / (magnitude_wrist * magnitude_palm)) * 180.0 / M_PI;
}

float computeWristRadialUlnarDeviation(const LEAP_VECTOR& wrist, const LEAP_VECTOR& palm) {
    float dot_product = wrist.x * palm.x + wrist.z * palm.z;
    float magnitude_wrist = std::sqrt(wrist.x * wrist.x + wrist.z * wrist.z);
    float magnitude_palm = std::sqrt(palm.x * palm.x + palm.z * palm.z);
    
    if (magnitude_wrist == 0 || magnitude_palm == 0) {
        return 0;  // or some default value
    }
    
    return std::acos(dot_product / (magnitude_wrist * magnitude_palm)) * 180.0 / M_PI;
}

// Constructor
LeapTracker::LeapTracker(const std::string& clientName, int sessionNumber, const std::string& exerciseName, const char* oscIP, int oscPort, int wsPort)
    : clientName(clientName), sessionNumber(sessionNumber), exerciseName(exerciseName), oscIP(oscIP), oscPort(oscPort), isTracking(false)
{
    try {
        // Default to current working directory
        std::string filePath = "./";
        std::string fileName = (clientName.empty() ? "UnknownClient" : clientName) + "_session" + std::to_string(sessionNumber) + "_" + exerciseName + ".csv";
        filePath += fileName;

        // Check if file exists and generate a unique filename if necessary
        while (fileExists(filePath)) {
            sessionNumber++;
            filePath = "./" + (clientName.empty() ? "UnknownClient" : clientName) + "_session" + std::to_string(sessionNumber) + "_" + exerciseName + ".csv";
        }

        std::cout << "Creating log file: " << filePath << std::endl;

        logFile.open(filePath, std::ofstream::out);
        if (logFile.is_open()) {
            logFile << "Client Name,Session Number,Exercise Name,Timestamp,Hand,"
                    << "Thumb X,Thumb Y,Thumb Z,Index X,Index Y,Index Z,Middle X,Middle Y,Middle Z,Ring X,Ring Y,Ring Z,Pinky X,Pinky Y,Pinky Z,"
                    << "Thumb MCP,Thumb PIP,Thumb DIP,Index MCP,Index PIP,Index DIP,Middle MCP,Middle PIP,Middle DIP,Ring MCP,Ring PIP,Ring DIP,Pinky MCP,Pinky PIP,Pinky DIP,"
                    << "Wrist X,Wrist Y,Wrist Z,Wrist Flexion,Wrist Extension,Radial Deviation,Ulnar Deviation,"
                    << "Palm X,Palm Y,Palm Z,Palm Roll,Palm Pitch,Palm Yaw,Hand Roll,Hand Pitch,Hand Yaw,"
                    << "Thumb-Index Distance,Thumb-Middle Distance,Thumb-Ring Distance,Thumb-Pinky Distance\n";
            std::cout << "Log file created at: " << filePath << std::endl;
        } else {
            std::cerr << "Failed to open log file at: " << filePath << std::endl;
            throw std::runtime_error("Failed to open log file");
        }

        // Initialise OSC
        oscSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
        if (oscSocket == -1) {
            throw std::runtime_error("Failed to create OSC socket");
        }

        memset(&oscAddr, 0, sizeof(oscAddr));
        oscAddr.sin_family = AF_INET;
        oscAddr.sin_port = htons(oscPort);
        oscAddr.sin_addr.s_addr = inet_addr(oscIP);

        std::cout << "OSC initialised with IP: " << this->oscIP << ", Port: " << this->oscPort << std::endl;

        initialiseWebSocket(wsPort);
    }
    catch (const std::exception& e) {
        std::cerr << "Error in LeapTracker constructor: " << e.what() << std::endl;
        throw;
    }
}

// Destructor
LeapTracker::~LeapTracker() {
    stopTracking();
    if (logFile.is_open()) {
        logFile.close();
    }
    close(oscSocket);
    if (wsServer) {
        wsServer->stop_listening();
        wsServer->stop();
    }
    if (wsThread.joinable()) {
        wsThread.join();
    }
}

void LeapTracker::initialiseWebSocket(int port) {
    try {
        wsServer = std::make_unique<WsServer>();
        wsServer->init_asio();
        wsServer->set_reuse_addr(true);

        wsServer->set_open_handler([this](websocketpp::connection_hdl hdl) {
            onWebSocketOpen(hdl);
        });

        wsServer->set_close_handler([this](websocketpp::connection_hdl hdl) {
            onWebSocketClose(hdl);
        });

        wsServer->set_message_handler([this](websocketpp::connection_hdl hdl, WsServer::message_ptr msg) {
            // Handle incoming messages if needed
        });

        wsServer->listen(port);
        wsServer->start_accept();

        wsThread = std::thread([this]() {
            try {
                wsServer->run();
            }
            catch (const std::exception& e) {
                std::cerr << "Error in WebSocket server: " << e.what() << std::endl;
            }
        });
    }
    catch (const std::exception& e) {
        std::cerr << "Error initialising WebSocket: " << e.what() << std::endl;
        throw;
    }
}


void LeapTracker::onWebSocketOpen(websocketpp::connection_hdl hdl) {
    wsConnections.insert(hdl);
}

void LeapTracker::onWebSocketClose(websocketpp::connection_hdl hdl) {
    wsConnections.erase(hdl);
}

void LeapTracker::broadcastWebSocketMessage(const std::string& message) {
    for (auto& hdl : wsConnections) {
        try {
            wsServer->send(hdl, message, websocketpp::frame::opcode::text);
        } catch (const websocketpp::exception& e) {
            std::cerr << "Error sending WebSocket message: " << e.what() << std::endl;
        }
    }
}

float LeapTracker::calculateMakeAFistMetric(const LEAP_HAND* hand) {
    float totalFlexion = 0.0f;
    const LEAP_DIGIT* fingers[] = {&hand->thumb, &hand->index, &hand->middle, &hand->ring, &hand->pinky};
    
    for (const LEAP_DIGIT* finger : fingers) {
        float mcpAngle = calculateAngleBetweenBones(finger->metacarpal, finger->proximal);
        float pipAngle = calculateAngleBetweenBones(finger->proximal, finger->intermediate);
        float dipAngle = calculateAngleBetweenBones(finger->intermediate, finger->distal);
        
        totalFlexion += mcpAngle + pipAngle + dipAngle;
    }
    
    // Adjust these values based on observed min/max totalFlexion
    float minFlexion = 50.0f;  // Adjust this: typical value for an open hand
    float maxFlexion = 700.0f;  // Fully closed fist (keep this if it works well for closed fist)
    
    // Expand the range by adjusting the normalisation
    float n = (totalFlexion - minFlexion) / (maxFlexion - minFlexion);
    
    // Optional: Apply a power function to emphasize lower values
    //float power = 1.5f; // Adjust this value to fine-tune the curve
    //n = std::pow(n, power);
    
    return std::min(1.0f, std::max(0.0f, n));
}

float LeapTracker::calculateAngleBetweenBones(const LEAP_BONE& bone1, const LEAP_BONE& bone2) {
    LEAP_VECTOR vec1 = {
        bone1.next_joint.x - bone1.prev_joint.x,
        bone1.next_joint.y - bone1.prev_joint.y,
        bone1.next_joint.z - bone1.prev_joint.z
    };
    LEAP_VECTOR vec2 = {
        bone2.next_joint.x - bone2.prev_joint.x,
        bone2.next_joint.y - bone2.prev_joint.y,
        bone2.next_joint.z - bone2.prev_joint.z
    };
    
    float dot_product = vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
    float magnitude1 = std::sqrt(vec1.x * vec1.x + vec1.y * vec1.y + vec1.z * vec1.z);
    float magnitude2 = std::sqrt(vec2.x * vec2.x + vec2.y * vec2.y + vec2.z * vec2.z);
    
    float cos_angle = dot_product / (magnitude1 * magnitude2);
    cos_angle = std::max(-1.0f, std::min(1.0f, cos_angle));  // Clamp to [-1, 1] to avoid domain errors
    
    return std::acos(cos_angle) * (180.0f / M_PI);  // Convert to degrees
}

float LeapTracker::calculatePronationSupinationMetric(const LEAP_HAND* hand) {
    // Use palm normal to determine pronation/supination
    float angle = std::atan2(hand->palm.normal.y, hand->palm.normal.x);
    // Normalise angle to 0-1 range, where 0 is full pronation and 1 is full supination
    return static_cast<float>((angle + M_PI/2) / M_PI);
}

float LeapTracker::calculateWristAROMMetric(const LEAP_HAND* hand) {
    // Calculate wrist angle relative to forearm
    LEAP_VECTOR wristDirection = {
        hand->arm.next_joint.x - hand->arm.prev_joint.x,
        hand->arm.next_joint.y - hand->arm.prev_joint.y,
        hand->arm.next_joint.z - hand->arm.prev_joint.z
    };
    LEAP_VECTOR palmDirection = hand->palm.direction;
    
    // Normalise vectors
    float wristMagnitude = std::sqrt(wristDirection.x * wristDirection.x + wristDirection.y * wristDirection.y + wristDirection.z * wristDirection.z);
    float palmMagnitude = std::sqrt(palmDirection.x * palmDirection.x + palmDirection.y * palmDirection.y + palmDirection.z * palmDirection.z);
    
    LEAP_VECTOR normalisedWristDirection = {
        wristDirection.x / wristMagnitude,
        wristDirection.y / wristMagnitude,
        wristDirection.z / wristMagnitude
    };
    
    LEAP_VECTOR normalisedPalmDirection = {
        palmDirection.x / palmMagnitude,
        palmDirection.y / palmMagnitude,
        palmDirection.z / palmMagnitude
    };
    
    float dotProduct = normalisedWristDirection.x * normalisedPalmDirection.x + 
                       normalisedWristDirection.y * normalisedPalmDirection.y + 
                       normalisedWristDirection.z * normalisedPalmDirection.z;
    
    float angle = std::acos(std::max(-1.0f, std::min(1.0f, dotProduct)));
    
    // Map angle to 0-1 range, where 0.5 is neutral, 1 is max upward bend, and 0 is max downward bend
    const float maxAngle = static_cast<float>(M_PI / 2); // 90 degrees
    float normalisedAngle = angle / maxAngle;
    
    // Determine if the bend is upward or downward
    float upDownFactor = normalisedPalmDirection.y > 0 ? 1.0f : -1.0f;
    
    // Map the range [-1, 1] to [0, 1]
    return std::max(0.0f, std::min(1.0f, (normalisedAngle * upDownFactor + 1.0f) / 2.0f));
}

// Start tracking
void LeapTracker::startTracking() {
    isTracking = true;
    pollingThread = std::thread(&LeapTracker::pollConnection, this);
}

// Stop tracking
void LeapTracker::stopTracking() {
    isTracking = false;
    if (pollingThread.joinable()) {
        pollingThread.join();
    }
}

std::string LeapTracker::getLatestData() {
    return latestData;
}

void LeapTracker::pollConnection() {
    LEAP_CONNECTION_MESSAGE msg;
    eLeapRS result = LeapCreateConnection(nullptr, &connection);
    if (result != eLeapRS_Success) {
        std::cerr << "Failed to create connection: " << result << std::endl;
        return;
    }

    result = LeapOpenConnection(connection);
    if (result != eLeapRS_Success) {
        std::cerr << "Failed to open connection: " << result << std::endl;
        return;
    }

    bool policySet = false;
    while (isTracking) {
        result = LeapPollConnection(connection, 1000, &msg);
        if (result == eLeapRS_Success) {
            switch (msg.type) {
                case eLeapEventType_Connection:
                    std::cout << "Connected to Leap Service" << std::endl;
                    if (!policySet) {
                        result = LeapSetPolicyFlags(connection, eLeapPolicyFlag_Images | eLeapPolicyFlag_MapPoints, 0);
                        if (result == eLeapRS_Success) {
                            std::cout << "Successfully set policy flags" << std::endl;
                            policySet = true;
                        } else {
                            std::cerr << "Failed to set policy flags: " << result << std::endl;
                        }
                    }
                    break;
                case eLeapEventType_Tracking:
                    processFrame(msg.tracking_event);
                    break;
                default:
                    break;
            }
        }
    }

    LeapCloseConnection(connection);
    LeapDestroyConnection(connection);
}

void LeapTracker::processFrame(const LEAP_TRACKING_EVENT* frame) {
    // Send hand presence OSC message before processing individual hands
    bool handPresent = frame->nHands > 0;
    sendHandPresenceOsc(handPresent);

    nlohmann::json frameData;
    frameData["timestamp"] = getCurrentTimestamp();
    frameData["handPresent"] = handPresent;

    for (uint32_t h = 0; h < frame->nHands; h++) {
        const LEAP_HAND* hand = &frame->pHands[h];
        LEAP_VECTOR thumbPos = hand->thumb.distal.next_joint;
        LEAP_VECTOR indexPos = hand->index.distal.next_joint;
        LEAP_VECTOR middlePos = hand->middle.distal.next_joint;
        LEAP_VECTOR ringPos = hand->ring.distal.next_joint;
        LEAP_VECTOR pinkyPos = hand->pinky.distal.next_joint;

        thumbIndexDistance = calculateDistance(thumbPos, indexPos);
        thumbMiddleDistance = calculateDistance(thumbPos, middlePos);
        thumbRingDistance = calculateDistance(thumbPos, ringPos);
        thumbPinkyDistance = calculateDistance(thumbPos, pinkyPos);

        std::stringstream ss;
        ss << clientName << "," << sessionNumber << "," << exerciseName << "," << getCurrentTimestamp() << "," << hand->type << ",";

        // Collect finger data
        LEAP_DIGIT fingers[5] = { hand->thumb, hand->index, hand->middle, hand->ring, hand->pinky };
        std::string fingerNames[5] = {"thumb", "index", "middle", "ring", "pinky"};
        for (int i = 0; i < 5; i++) {
            const auto& finger = fingers[i];
            LEAP_VECTOR tip = finger.distal.next_joint;
            ss << tip.x << "," << tip.y << "," << tip.z << ",";
            
            frameData["fingers"][fingerNames[i]] = {
                {"x", tip.x},
                {"y", tip.y},
                {"z", tip.z}
            };
        }

        // Calculate and collect joint angles
        for (int i = 0; i < 5; i++) {
            const auto& finger = fingers[i];
            float mcp = calculateAngle(finger.metacarpal.prev_joint, finger.metacarpal.next_joint, finger.proximal.next_joint);
            float pip = calculateAngle(finger.metacarpal.next_joint, finger.proximal.next_joint, finger.intermediate.next_joint);
            float dip = calculateAngle(finger.proximal.next_joint, finger.intermediate.next_joint, finger.distal.next_joint);
            ss << mcp << "," << pip << "," << dip << ",";
            
            frameData["joints"][fingerNames[i]] = {
                {"mcp", mcp},
                {"pip", pip},
                {"dip", dip}
            };
        }

        // Collect wrist and palm data
        LEAP_VECTOR wristPos = hand->palm.position;
        LEAP_VECTOR palmPos = hand->palm.position;
        float palmRoll = computeRoll(hand->palm.normal);
        float palmPitch = computePitch(hand->palm.direction);
        float palmYaw = computeYaw(hand->palm.direction);
        float handRoll = palmRoll;
        float handPitch = palmPitch;
        float handYaw = palmYaw;
        float wristFlexionExtension = computeWristFlexionExtension(wristPos, palmPos);
        float wristRadialUlnarDeviation = computeWristRadialUlnarDeviation(wristPos, palmPos);

        ss  << wristPos.x << "," << wristPos.y << "," << wristPos.z << ","
            << wristFlexionExtension << "," << "0" << "," 
            << wristRadialUlnarDeviation << "," << "0" << ","
            << palmPos.x << "," << palmPos.y << "," << palmPos.z << ","
            << palmRoll << "," << palmPitch << "," << palmYaw << ","
            << handRoll << "," << handPitch << "," << handYaw << ","
            << thumbIndexDistance << "," << thumbMiddleDistance << ","
            << thumbRingDistance << "," << thumbPinkyDistance << "\n";

        frameData["wrist"] = {
            {"x", wristPos.x},
            {"y", wristPos.y},
            {"z", wristPos.z},
            {"flexionExtension", wristFlexionExtension},
            {"radialUlnarDeviation", wristRadialUlnarDeviation}
        };

        frameData["palm"] = {
            {"x", palmPos.x},
            {"y", palmPos.y},
            {"z", palmPos.z},
            {"roll", palmRoll},
            {"pitch", palmPitch},
            {"yaw", palmYaw}
        };

        frameData["hand"] = {
            {"roll", handRoll},
            {"pitch", handPitch},
            {"yaw", handYaw}
        };

        frameData["distances"] = {
            {"thumbIndex", thumbIndexDistance},
            {"thumbMiddle", thumbMiddleDistance},
            {"thumbRing", thumbRingDistance},
            {"thumbPinky", thumbPinkyDistance}
        };

        std::string logEntry = ss.str();
        logFile << logEntry;
        std::cout << logEntry;  // Stream to terminal

        // Calculate and send exercise metrics
        float makeAFistMetric = calculateMakeAFistMetric(hand);
        float pronationSupinationMetric = calculatePronationSupinationMetric(hand);
        float wristAROMMetric = calculateWristAROMMetric(hand);

        frameData["metrics"] = {
            {"makeAFist", makeAFistMetric},
            {"pronationSupination", pronationSupinationMetric},
            {"wristAROM", wristAROMMetric}
        };

        // Send individual OSC messages
        sendOscMessage("/leap/thumb_x", thumbPos.x);
        sendOscMessage("/leap/thumb_y", thumbPos.y);
        sendOscMessage("/leap/thumb_z", thumbPos.z);
        sendOscMessage("/leap/index_x", indexPos.x);
        sendOscMessage("/leap/index_y", indexPos.y);
        sendOscMessage("/leap/index_z", indexPos.z);
        sendOscMessage("/leap/middle_x", middlePos.x);
        sendOscMessage("/leap/middle_y", middlePos.y);
        sendOscMessage("/leap/middle_z", middlePos.z);
        sendOscMessage("/leap/ring_x", ringPos.x);
        sendOscMessage("/leap/ring_y", ringPos.y);
        sendOscMessage("/leap/ring_z", ringPos.z);
        sendOscMessage("/leap/pinky_x", pinkyPos.x);
        sendOscMessage("/leap/pinky_y", pinkyPos.y);
        sendOscMessage("/leap/pinky_z", pinkyPos.z);
        sendOscMessage("/leap/thumb_index_distance", thumbIndexDistance);
        sendOscMessage("/leap/thumb_middle_distance", thumbMiddleDistance);
        sendOscMessage("/leap/thumb_ring_distance", thumbRingDistance);
        sendOscMessage("/leap/thumb_pinky_distance", thumbPinkyDistance);
        sendOscMessage("/leap/make_a_fist", makeAFistMetric);
        sendOscMessage("/leap/pronation_supination", pronationSupinationMetric);
        sendOscMessage("/leap/wrist_arom", wristAROMMetric);
    }

    broadcastWebSocketMessage(frameData.dump());
}


float LeapTracker::calculateDistance(const LEAP_VECTOR& p1, const LEAP_VECTOR& p2) {
    float dx = p1.x - p2.x;
    float dy = p1.y - p2.y;
    float dz = p1.z - p2.z;
    return std::sqrt(dx*dx + dy*dy + dz*dz);
}

float LeapTracker::calculateAngle(const LEAP_VECTOR& p1, const LEAP_VECTOR& p2, const LEAP_VECTOR& p3) {
    LEAP_VECTOR v1 = { p2.x - p1.x, p2.y - p1.y, p2.z - p1.z };
    LEAP_VECTOR v2 = { p3.x - p2.x, p3.y - p2.y, p3.z - p2.z };
    float dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    float mag1 = std::sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    float mag2 = std::sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    return std::acos(dot / (mag1 * mag2)) * 180.0 / M_PI;
}

std::string LeapTracker::getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&in_time_t), "%Y-%m-%d %X");
    return ss.str();
}

bool LeapTracker::fileExists(const std::string& filePath) {
    struct stat buffer;
    return (stat(filePath.c_str(), &buffer) == 0);
}

void LeapTracker::sendOscMessage(const char* address, float value) {
    char buffer[OUTPUT_BUFFER_SIZE];
    tosc_writeMessage(buffer, sizeof(buffer), address, "f", value);
    sendto(oscSocket, buffer, sizeof(buffer), 0, (struct sockaddr*)&oscAddr, sizeof(oscAddr));
}

void LeapTracker::sendHandPresenceOsc(bool isPresent) {
    sendOscMessage("/leap/hand_presence", isPresent ? 1.0f : 0.0f);
}

// end of  LeapTracker.cpp//

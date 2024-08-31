//
//  LeapTracker.hpp
//  LeapTracker
//  Created by Fergal Davis on 29/07/2024.
//
#ifndef LeapTracker_hpp
#define LeapTracker_hpp

#include "LeapC.h"
#include <string>
#include <thread>
#include <fstream>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <set>
#include <memory>

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

using WsServer = websocketpp::server<websocketpp::config::asio>;

class LeapTracker {
public:
    LeapTracker(const std::string& clientName, int sessionNumber, const std::string& exerciseName, const char* oscIP, int oscPort, int wsPort);
    ~LeapTracker();

    void startTracking();
    void stopTracking();
    std::string getLatestData();

private:
    LEAP_CONNECTION connection;
    std::string latestData;
    bool isTracking;
    std::ofstream logFile;
    std::string clientName;
    int sessionNumber;
    std::string exerciseName;

    void pollConnection();
    void processFrame(const LEAP_TRACKING_EVENT* frame);
    float calculateDistance(const LEAP_VECTOR& p1, const LEAP_VECTOR& p2);
    std::string getCurrentTimestamp();
    std::thread pollingThread;

    float thumbIndexDistance;
    float thumbMiddleDistance;
    float thumbRingDistance;
    float thumbPinkyDistance;

    float calculateAngle(const LEAP_VECTOR& p1, const LEAP_VECTOR& p2, const LEAP_VECTOR& p3);
    float calculateAngleBetweenBones(const LEAP_BONE& bone1, const LEAP_BONE& bone2);
    bool fileExists(const std::string& filePath);

    // OSC-related members
    int oscSocket;
    struct sockaddr_in oscAddr;
    int oscPort;
    std::string oscIP;
    void sendHandPresenceOsc(bool isPresent);
    void sendOscMessage(const char* address, float value);

    float calculateMakeAFistMetric(const LEAP_HAND* hand);
    float calculatePronationSupinationMetric(const LEAP_HAND* hand);
    float calculateWristAROMMetric(const LEAP_HAND* hand);

    std::unique_ptr<WsServer> wsServer;
    std::thread wsThread;
    std::set<websocketpp::connection_hdl, std::owner_less<websocketpp::connection_hdl>> wsConnections;

    void initialiseWebSocket(int port);
    void broadcastWebSocketMessage(const std::string& message);
    void onWebSocketOpen(websocketpp::connection_hdl hdl);
    void onWebSocketClose(websocketpp::connection_hdl hdl);
};

#endif /* LeapTracker_hpp */
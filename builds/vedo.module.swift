
import Foundation

struct VedoAPI {
    static let baseURL = "https://dashboard.vedo.socket/v1/API"
    static let apiKey = "vedo::g61!msL.p28_bni1ZpK"
    
    enum Endpoint {
        case search
        case upload
        case analyze
        
        var path: String {
            switch self {
            case .search: return "/search"
            case .upload: return "/upload"
            case .analyze: return "/analyze"
            }
        }
    }
    
    static func request<T: Codable>(_ endpoint: Endpoint, method: String = "GET", parameters: [String: Any]? = nil, completion: @escaping (Result<T, Error>) -> Void) {
        guard var components = URLComponents(string: baseURL + endpoint.path) else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        if let parameters = parameters {
            components.queryItems = parameters.map { URLQueryItem(name: $0.key, value: "\($0.value)") }
        }
        
        guard let url = components.url else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data received", code: 0, userInfo: nil)))
                return
            }
            
            do {
                let decodedResponse = try JSONDecoder().decode(T.self, from: data)
                completion(.success(decodedResponse))
            } catch {
                completion(.failure(error))
            }
        }
        
        task.resume()
    }
    
    static func search(query: String, completion: @escaping (Result<SearchResponse, Error>) -> Void) {
        request(.search, parameters: ["query": query], completion: completion)
    }
    
    static func upload(data: Data, completion: @escaping (Result<UploadResponse, Error>) -> Void) {
        request(.upload, method: "POST", parameters: ["data": data.base64EncodedString()], completion: completion)
    }
    
    static func analyze(id: String, completion: @escaping (Result<AnalyzeResponse, Error>) -> Void) {
        request(.analyze, parameters: ["id": id], completion: completion)
    }
}

// Example response structures (replace with actual API response structures)
struct SearchResponse: Codable {
    let results: [String]
}

struct UploadResponse: Codable {
    let id: String
}

struct AnalyzeResponse: Codable {
    let analysis: String
}

use axum::{http::StatusCode, Json};

pub type HttpError = (StatusCode, String);
pub type Resp<T> = Result<Json<T>, HttpError>;

pub fn err_400(msg: impl Into<String>) -> HttpError {
    (StatusCode::BAD_REQUEST, msg.into())
}

pub fn err_404(msg: impl Into<String>) -> HttpError {
    (StatusCode::NOT_FOUND, msg.into())
}

pub fn err_500(e: impl std::fmt::Display) -> HttpError {
    (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
}


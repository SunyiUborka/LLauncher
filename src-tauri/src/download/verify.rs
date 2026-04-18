use md5::{Digest, Md5};
use std::path::Path;

use crate::error::AppError;

pub fn verify_md5(path: &Path, expected: &str) -> Result<bool, AppError> {
    let mut hasher = Md5::new();
    let mut file = std::fs::File::open(path)?;
    std::io::copy(&mut file, &mut hasher)?;
    let result = format!("{:x}", hasher.finalize());
    Ok(result == expected)
}

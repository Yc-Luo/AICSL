"""Tests for security utilities."""

import pytest

from app.core.security import (
    sanitize_input,
    validate_mongodb_query,
    validate_password_strength,
    sanitize_filename,
    validate_file_type,
)


class TestSecurity:
    """Test security utility functions."""

    def test_sanitize_input_basic(self):
        """Test basic input sanitization."""
        input_text = '<script>alert("xss")</script>Hello World'
        result = sanitize_input(input_text)

        assert "<script>" not in result
        assert "alert" not in result
        assert "Hello World" in result

    def test_sanitize_input_html_entities(self):
        """Test HTML entity escaping."""
        input_text = '<b>Bold</b> & "quotes"'
        result = sanitize_input(input_text)

        assert result == '&lt;b&gt;Bold&lt;/b&gt; &amp; &quot;quotes&quot;'

    def test_sanitize_input_normal_text(self):
        """Test normal text passes through."""
        input_text = "Normal text without HTML"
        result = sanitize_input(input_text)

        assert result == input_text

    def test_validate_mongodb_query_safe(self):
        """Test safe MongoDB query validation."""
        safe_query = {"user_id": "123", "status": "active"}
        result = validate_mongodb_query(safe_query)

        assert result is True

    def test_validate_mongodb_query_dangerous(self):
        """Test dangerous MongoDB query validation."""
        dangerous_query = {"$where": "this.user_id == '123'"}
        result = validate_mongodb_query(dangerous_query)

        assert result is False

    def test_validate_mongodb_query_mixed(self):
        """Test mixed MongoDB query validation."""
        mixed_query = {"user_id": "123", "$eval": "malicious_code"}
        result = validate_mongodb_query(mixed_query)

        assert result is False

    def test_validate_password_strength_strong(self):
        """Test strong password validation."""
        strong_password = "MySecurePass123!"
        is_valid, error = validate_password_strength(strong_password)

        assert is_valid is True
        assert error == ""

    def test_validate_password_strength_too_short(self):
        """Test too short password validation."""
        short_password = "12345"
        is_valid, error = validate_password_strength(short_password)

        assert is_valid is False
        assert "at least 8 characters" in error

    def test_validate_password_strength_no_uppercase(self):
        """Test password without uppercase validation."""
        no_upper_password = "mysecurepass123"
        is_valid, error = validate_password_strength(no_upper_password)

        assert is_valid is False
        assert "uppercase letter" in error

    def test_validate_password_strength_no_lowercase(self):
        """Test password without lowercase validation."""
        no_lower_password = "MYSECUREPASS123"
        is_valid, error = validate_password_strength(no_lower_password)

        assert is_valid is False
        assert "lowercase letter" in error

    def test_validate_password_strength_no_digit(self):
        """Test password without digit validation."""
        no_digit_password = "MySecurePass"
        is_valid, error = validate_password_strength(no_digit_password)

        assert is_valid is False
        assert "digit" in error

    def test_sanitize_filename_safe(self):
        """Test safe filename sanitization."""
        safe_filename = "document.pdf"
        result = sanitize_filename(safe_filename)

        assert result == safe_filename

    def test_sanitize_filename_dangerous(self):
        """Test dangerous filename sanitization."""
        dangerous_filename = "../../../etc/passwd"
        result = sanitize_filename(dangerous_filename)

        assert ".." not in result
        assert "/" not in result
        assert "\\" not in result

    def test_sanitize_filename_special_chars(self):
        """Test filename with special characters."""
        special_filename = 'file<>:"/\\|?*.txt'
        result = sanitize_filename(special_filename)

        assert "<" not in result
        assert ">" not in result
        assert ":" not in result
        assert '"' not in result
        assert "/" not in result
        assert "\\" not in result
        assert "|" not in result
        assert "?" not in result
        assert "*" not in result

    def test_sanitize_filename_leading_dots(self):
        """Test filename with leading dots."""
        dot_filename = "...hidden_file"
        result = sanitize_filename(dot_filename)

        assert not result.startswith(".")

    def test_sanitize_filename_long_name(self):
        """Test very long filename."""
        long_filename = "a" * 300
        result = sanitize_filename(long_filename)

        assert len(result) <= 255

    def test_sanitize_filename_empty(self):
        """Test empty filename."""
        empty_filename = ""
        result = sanitize_filename(empty_filename)

        assert result == "unnamed_file"

    def test_validate_file_type_allowed(self):
        """Test allowed file type validation."""
        filename = "document.pdf"
        allowed_extensions = [".pdf", ".docx", ".txt"]

        result = validate_file_type(filename, allowed_extensions)
        assert result is True

    def test_validate_file_type_not_allowed(self):
        """Test not allowed file type validation."""
        filename = "document.exe"
        allowed_extensions = [".pdf", ".docx", ".txt"]

        result = validate_file_type(filename, allowed_extensions)
        assert result is False

    def test_validate_file_type_no_extension(self):
        """Test filename without extension."""
        filename = "document"
        allowed_extensions = [".pdf", ".docx", ".txt"]

        result = validate_file_type(filename, allowed_extensions)
        assert result is False

    def test_validate_file_type_empty_filename(self):
        """Test empty filename."""
        filename = ""
        allowed_extensions = [".pdf", ".docx", ".txt"]

        result = validate_file_type(filename, allowed_extensions)
        assert result is False

    def test_validate_file_type_uppercase_extension(self):
        """Test uppercase file extension."""
        filename = "document.PDF"
        allowed_extensions = [".pdf", ".docx", ".txt"]

        result = validate_file_type(filename, allowed_extensions)
        assert result is True


import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

// SVG 아이콘
const Icons = {
  Back: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  DefaultProfile: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="white">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function ProfileEditPage() {
  const navigate = useNavigate();
  
  // 초기값은 실제 유저 정보가 있다면 그걸로 설정 (예: useEffect로 받아온 값)
  const [nickname, setNickname] = useState('music_cat');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    // 1. 유효성 검사
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요!");
      return;
    }

    try {
      // 2. FormData 객체 생성
      const formData = new FormData();
      
      // 백엔드 명세서에 맞춘 키 값 설정 (보통 'nickname', 'image' 등을 사용)
      formData.append('nickname', nickname); 
      
      if (profileImage) {
        // 'profileImage'는 백엔드가 정한 파일 키 이름이어야 합니다. (다를 경우 수정 필요)
        formData.append('profileImage', profileImage); 
      }

      // 3. 서버 전송 (API 주소는 백엔드 명세에 따라 수정 필요)
      const response = await axios.patch('/api/members/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // 파일 전송 필수 헤더
          // 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // 토큰 필요시 주석 해제
        },
      });

      if (response.status === 200) {
        console.log('수정 성공:', response.data);
        alert('프로필이 수정되었습니다!');
        navigate('/gps');
      }

    } catch (error) {
      console.error('프로필 수정 실패:', error);
      alert('프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="clean-profile-bg">
      
      {/* 1. 상단 헤더 */}
      <div className="profile-header-container" style={{ marginTop: '10px', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
        <button className="header-btn" onClick={() => navigate(-1)}>
          <Icons.Back />
        </button>
        
        <span className="profile-header-title">프로필 수정</span>
        
        <button className="header-btn confirm-btn" onClick={handleSubmit}>
          확인
        </button>
      </div>

      {/* 2. 프로필 사진 편집 영역 */}
      <div className="profile-edit-section" style={{ marginTop: '50px', marginBottom: '40px' }}>
        <div className="profile-image-circle" onClick={handleProfileClick}>
          {previewUrl ? (
            <img src={previewUrl} alt="프로필 미리보기" />
          ) : (
            <Icons.DefaultProfile />
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: 'none' }}
          accept="image/*"
        />

        <span className="profile-edit-label">사진 편집</span>
      </div>

      {/* 3. 닉네임 입력 영역 */}
      <div className="nickname-row">
        <label className="nickname-label-text">닉네임</label>
        <input 
          className="nickname-input-custom"
          type="text" 
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
        />
      </div>

    </div>
  );
}
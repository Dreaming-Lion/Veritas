package com.mycompany.CapstoneDesign.user;

//package com.mycompany.CapstoneDesign.service;

import java.util.List;

public interface UserService {

	// 1. 사용자 전체 조회
	List<UserVO> getUserList(); // 

	// 2. 특정 사용자 조회(id 기준)
	UserVO getUserByID(String id); // 

	// 3. 회원가입
	void insertUser(UserVO user); // 

	// 4. 정보 수정
//	void updateUser(UserVO user); // 

	// 5. 삭제
//	void deleteUser(String id); // 
	
	// 이메일로 회원조회, 로그인/계정 찾기등에 사용
	UserVO findByEmail(String email);
	
	boolean checkPassword(String id, String pw);
	
	boolean existsEmail(String email);
	
//	boolean existsNickname(String nickname);
	
//	String updateNickname(UserVO vo);
	
}
